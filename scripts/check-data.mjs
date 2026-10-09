import fs from 'node:fs';
import path from 'node:path';
import { validateItem, vocabIdsOf } from './quiz.mjs';
import { stop } from './knowledge.mjs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'public/data');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const catalog=read('catalog.json');
const lessons=[1,2,3,4].flatMap(n=>read(`books/${n}.json`));
const sentences=lessons.flatMap(l=>l.sentences);
const kp=new Map(catalog.kps.map(k=>[k.id,k]));
const sentenceMap=new Map(sentences.map(s=>[s.id,s]));
const lessonMap=new Map(lessons.map(l=>[l.id,l]));
const report={};let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
check(lessons.length===288,'288 source lessons');
check(JSON.stringify([1,2,3,4].map(n=>lessons.filter(l=>l.book===n).length))===JSON.stringify([72,96,60,60]),'book counts');
check(lessonMap.size===lessons.length&&sentenceMap.size===sentences.length&&kp.size===catalog.kps.length,'unique stable IDs');
check(catalog.clusters.length===25,'25 can-do paths');
check(lessons.filter(l=>l.book===4&&l.no===27).length===2,'preserve duplicate source numbering');
const occurrences=new Map();
for(let b=0;b<32;b++)for(const [id,rows] of Object.entries(read(`contexts/${b}.json`)))occurrences.set(id,rows);
let hitCount=0;
for(const lesson of lessons){
 check(lesson.sentences.length===lesson.sentenceCount,`sentence count ${lesson.id}`);
 check(lesson.clusterIds.length>0,`path coverage ${lesson.id}`);
 check(lesson.kpIds.every(id=>kp.has(id)),`valid lesson KPs ${lesson.id}`);
 const source=fs.readFileSync(path.join(root,'sources',lesson.sourceFile),'utf8');
 check(source.includes(lesson.sourceHeading),`original heading ${lesson.id}`);
 for(const sentence of lesson.sentences){
  check(sentence.sourceBlock.slice(sentence.sourceStart,sentence.sourceStart+sentence.text.length)===sentence.text,`exact source span ${sentence.id}`);
  check(sentence.sourceKind==='heading'?lesson.sourceHeading.includes(sentence.text):lesson.sourceBody.includes(sentence.text),`source inclusion ${sentence.id}`);
  for(const [id,start,end] of sentence.hits){
   hitCount++;check(kp.has(id)&&Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end<=sentence.text.length&&end>start,`hit bounds ${sentence.id}/${id}`);
   check(kp.get(id).lessonIds.includes(lesson.id),`KP lesson back-link ${id}`);
   check((occurrences.get(id)||[]).some(([sid,a,b])=>sid===sentence.id&&a===start&&b===end),`context back-link ${id}`);
  }
 }
}
for(const k of catalog.kps){
 check(k.lessonIds.length>0&&k.lessonIds.every(id=>lessonMap.has(id)),`valid KP origins ${k.id}`);
 check(k.related.every(id=>kp.has(id))&&k.contains.every(id=>kp.has(id))&&(!k.parent||kp.has(k.parent)),`valid relationships ${k.id}`);
 check((occurrences.get(k.id)||[]).length===k.frequency,`frequency ${k.id}`);
 for(const [sid,a,b] of occurrences.get(k.id)||[])check(sentenceMap.get(sid)?.hits.some(h=>h[0]===k.id&&h[1]===a&&h[2]===b),`reverse context ${k.id}/${sid}`);
}
for(const cluster of catalog.clusters)check(cluster.lessonIds.length>0&&cluster.lessonIds.every(id=>lessonMap.get(id)?.clusterIds.includes(cluster.id)),`nonempty bidirectional cluster ${cluster.id}`);
const pairs=read('pairs.json');check(pairs.length===100,'top 100 pairs');
for(const p of pairs){const both=lessonMap.get(p.a).kpIds.filter(id=>lessonMap.get(p.b).kpIds.includes(id));check(p.count>=3&&p.count===both.length&&p.kpIds.length===both.length&&p.kpIds.every(id=>both.includes(id)),`exact shared KP pair ${p.a}/${p.b}`);}
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/data-audit.json'),'utf8'));
for(const source of audit.sources)check(createHash('sha256').update(fs.readFileSync(path.join(root,'sources',source.filename))).digest('hex')===source.sha256,`source hash ${source.filename}`);
let gzipFiles=0;
function verifyGzip(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,entry.name);if(entry.isDirectory())verifyGzip(p);else if(entry.name.endsWith('.json.gz')){check(gunzipSync(fs.readFileSync(p)).equals(fs.readFileSync(p.slice(0,-3))),`gzip equality ${entry.name}`);gzipFiles++;}}}
verifyGzip(dir);
check(hitCount===catalog.stats.hits&&sentences.length===catalog.stats.sentences,'catalog aggregate counts');
// ── 语块健康度：这两项是防止词表退化的关键 ──
// 背景：这份语块清单曾经定义了 322 条却有 47 条在语料里一次都没匹配上，
// 其中 40 条（take care of / never mind / in a hurry…）连新概念四册都没有出现过。
// 死条目不会被任何页面显示，只会让"我们覆盖了 X 个语块"这个说法变得不诚实。
const {chunks:definedChunks,rules:definedRules,offCorpusPatterns}=await import('./knowledge.mjs');
const definedNames=new Set(definedChunks.map(c=>c.name));
const liveChunkNames=new Set(catalog.kps.filter(k=>k.type==='chunk').map(k=>k.name));
const deadChunks=[...definedNames].filter(n=>!liveChunkNames.has(n));
check(deadChunks.length===0,`no dead chunks (found ${deadChunks.length}: ${deadChunks.slice(0,8).join(', ')})`);
check(liveChunkNames.size===definedNames.size,`chunk list and catalog agree (${definedNames.size} vs ${liveChunkNames.size})`);
check(definedNames.size>=800,`chunk coverage target met (${definedNames.size} >= 800)`);

// 语块覆盖率：多少单词命中被语块完整包住——也就是"这个词的意思由语块承担，
// 不该单独给词义"的比例。介词类词条几乎全靠这一层。
let wordHits=0,coveredByChunk=0;
for(const lesson of lessons)for(const sentence of lesson.sentences){
 const chunkSpans=sentence.hits.filter(h=>kp.get(h[0])?.type==='chunk');
 for(const [id,start,end] of sentence.hits){
  if(kp.get(id)?.type!=='word')continue;
  wordHits++;
  if(chunkSpans.some(c=>c[1]<=start&&c[2]>=end&&(c[1]<start||c[2]>end)))coveredByChunk++;
 }
}
check(wordHits>0,'word hits present for chunk coverage metric');

// ── 第四册版本对齐：语料是 60 课版，官方是 48 课版 ──
// 不靠索引对齐（实测偏移 +1…+12），officialNo 来自内容匹配的对齐表。
const b4=lessons.filter(l=>l.book===4);
const b4Aligned=b4.filter(l=>l.officialNo!=null);
const b4CorpusOnly=b4.filter(l=>l.corpusOnly===true);
check(b4.length===60,'book 4 has 60 corpus lessons');
check(b4Aligned.length+b4CorpusOnly.length===b4.length,'every book-4 lesson is either aligned or marked corpus-only');
check(b4Aligned.length===catalog.books[3].alignedCount,'book-4 aligned count matches catalog declaration');
check(b4CorpusOnly.length===catalog.books[3].corpusOnlyCount,'book-4 corpus-only count matches catalog declaration');
{
 const nos=b4Aligned.map(l=>l.officialNo);
 check(new Set(nos).size===nos.length,'book-4 officialNo values are unique');
 check(nos.every(n=>Number.isInteger(n)&&n>=1&&n<=48),'book-4 officialNo within 1..48');
 const sorted=[...nos].sort((a,x)=>a-x);
 check(sorted.every((n,i)=>i===0||n>sorted[i-1]),'book-4 officialNo are strictly increasing along corpus order (proves段内插入而非重排)');
}
check(catalog.books[0].officialLessonCount===144&&catalog.books[0].corpusLessonCount===72,'book 1 declares 72/144 main-only range');
check(catalog.books[3].officialLessonCount===48,'book 4 declares official 48-lesson version');
check(b4.filter(l=>l.corpusOnly).every(l=>!l.officialNo),'corpus-only lessons carry no officialNo');

// ── 语法/句型的覆盖度：这两项是「高频规则掩盖低频缺失」的解药 ──
// 40 条规则曾经看起来覆盖 288/288 课，因为一般现在时命中 247 课、一般过去时 228 课，
// 「某课 0 语法命中」永远不会出现。所以必须单独盯「死规则」和「句型空白课」。
{
 const grammarDefs=definedRules.filter(r=>r.type==='grammar');
 const patternDefs=definedRules.filter(r=>r.type==='pattern');
 const liveIds=new Set(catalog.kps.map(k=>k.id));
 const deadRules=[...grammarDefs,...patternDefs].filter(r=>!liveIds.has(r.id)).map(r=>r.id);
 check(deadRules.length===0,`no dead grammar/pattern rules (found ${deadRules.length}: ${deadRules.slice(0,6).join(', ')})`);
 check(grammarDefs.length===catalog.stats.byType.grammar,`grammar rule count agrees (${grammarDefs.length} vs ${catalog.stats.byType.grammar})`);
 // 语料外句型：实测 0 命中而移出 rules 的条目。它们必须确实不在产物里，
 // 否则说明移错了；同时它们本身是「语料范围导致的教学点缺口」，要在报告里可见。
 check(offCorpusPatterns.every(id=>!liveIds.has(id)),'off-corpus patterns are absent from the catalog');
 report.offCorpusPatterns=offCorpusPatterns.length;
 check(patternDefs.length===catalog.stats.byType.pattern,`pattern rule count agrees (${patternDefs.length} vs ${catalog.stats.byType.pattern})`);

 // 句型覆盖率：多少课一条句型都没有。第一册基础问答句型缺失时这个数字很高。
 const noPattern=lessons.filter(l=>!l.sentences.some(s=>s.hits.some(h=>h[0].startsWith('p-')))).length;
 report.patternCoverage=Number((100*(lessons.length-noPattern)/lessons.length).toFixed(1));
 report.patternEmptyLessons=noPattern;

 // 规则使用率：命中数最低的规则要被看见。低于阈值的规则要么补正则，要么删。
 const freq=new Map(catalog.kps.filter(k=>k.type==='grammar'||k.type==='pattern').map(k=>[k.id,k.frequency]));
 // 低频规则：活着但证据薄弱。它们占着一个教学点，语料却撑不起来。
 // deadRules 只抓 0 命中，抓不到这一类。是否保留由 C 组的语料验证决定，
 // 这里只负责让它们可见——不可见的低频规则会一直躺到出题时才暴露。
 const LOW = 5;
 const lowFreq = [...grammarDefs,...patternDefs]
  .map(d=>catalog.kps.find(k=>k.id===d.id))
  .filter(k=>k&&k.frequency>0&&k.frequency<LOW)
  .sort((a,b)=>a.frequency-b.frequency);
 report.lowFrequencyRules = lowFreq.length;
 report.lowFrequencySample = lowFreq.slice(0,8).map(k=>`${k.id}(${k.frequency})`);
 check(lowFreq.length <= 40, `低频规则不应超过 40 条，当前 ${lowFreq.length}（规则数与语料证据脱节）`);
 report.ruleUsage={grammarRules:grammarDefs.length,patternRules:patternDefs.length,
  minGrammarFreq:Math.min(...catalog.kps.filter(k=>k.type==='grammar').map(k=>k.frequency)),
  minPatternFreq:Math.min(...catalog.kps.filter(k=>k.type==='pattern').map(k=>k.frequency))};
 void freq;
}

// ── 每册角色：引入册来自教材事实（scripts/book-roles.mjs），不是统计推断 ──
{
 const withIntro=catalog.kps.filter(k=>k.introduceBook!==null&&k.introduceBook!==undefined);
 check(withIntro.length>=24, `引入册事实条数不应低于 24，当前 ${withIntro.length}（疑似采信表被削弱）`);
 check(withIntro.every(k=>Number.isInteger(k.introduceBook)&&k.introduceBook>=1&&k.introduceBook<=4),'introduceBook 取值在 1..4');
 // 引入那册必须标 introduce
 const bad=withIntro.filter(k=>k.bookRoles?.[k.introduceBook]!=='introduce');
 check(bad.length===0, `引入册那一册必须标 introduce（异常 ${bad.length} 条：${bad.slice(0,3).map(k=>k.id).join(', ')}）`);
 // 引入册之前不该有任何角色
 const early=catalog.kps.filter(k=>k.introduceBook!=null&&Object.keys(k.bookRoles||{}).some(b=>Number(b)<k.introduceBook));
 check(early.length===0, `引入册之前不应有角色（异常 ${early.length} 条）`);
 // 角色词表封闭
 const ROLES=new Set(['introduce','reuse','contrast','fluency']);
 const badRole=catalog.kps.flatMap(k=>Object.values(k.bookRoles||{})).filter(r=>!ROLES.has(r));
 check(badRole.length===0, `bookRole 取值越界：${[...new Set(badRole)].join(', ')}`);
 report.kpWithIntroduceBook=withIntro.length;
}

// ── 语法元数据：英文术语与结构公式必须覆盖全部语法规则 ──
{
 const gs=catalog.kps.filter(k=>k.type==='grammar');
 const noMeta=gs.filter(k=>!k.enName||!k.formula);
 check(noMeta.length===0, `每条语法规则都要有英文术语与结构公式（缺 ${noMeta.length} 条：${noMeta.slice(0,4).map(k=>k.id).join(', ')}）`);
 const LEVELS=new Set(['basic','intermediate','upper','advanced']);
 check(catalog.kps.every(k=>k.level==null||LEVELS.has(k.level)),'level 取值在封闭词表内');
 // level 必须与 introduceBook 一致：有引入册才有难度，且册次对应
 const bad=catalog.kps.filter(k=>k.introduceBook!=null&&k.level==null);
 check(bad.length===0, `有引入册依据的规则必须有 level（缺 ${bad.length} 条）`);
 const stray=catalog.kps.filter(k=>k.introduceBook==null&&k.level!=null);
 check(stray.length===0, `没有引入册依据的规则不应有 level（多出 ${stray.length} 条）`);
 report.kpWithFormula=gs.filter(k=>k.formula).length;
}

// ── 教材教学事实 → 语料证据 ──
// 每一条教材事实都要求对应课文里能检出该规则。这不只是完整性检查：
// 首轮核对就抓出 g-present-perfect 的三个缺陷，所以它同时是规则回归夹具。
{
 const factsPath=new URL('../corpora/nce/teaching-facts.json',import.meta.url);
 {
  const facts=JSON.parse(fs.readFileSync(factsPath,'utf8'));
  const lessonById=new Map(lessons.map(l=>[l.id,l]));
  const miss=[];
  for(const p of facts.points){
   if(p.confidence!=='high') continue;
   const l=lessonById.get(p.corpusLesson);
   if(!l){ miss.push(`${p.corpusLesson}(课文不存在)`); continue; }
   const n=(l.sentences||[]).reduce((a,s)=>a+s.hits.filter(h=>h[0]===p.kpId).length,0);
   if(n===0) miss.push(`${p.book}-${p.officialLesson}:${p.kpId}`);
  }
  const high=facts.points.filter(p=>p.confidence==='high');
  check(miss.length===0, `教材事实在课文里应有证据，缺失 ${miss.length} 条：${miss.slice(0,5).join(', ')}`);
  report.teachingFacts={total:facts.points.length,highConfidence:high.length,verified:high.length-miss.length};
 }
}

// ── 教学点：与语言对象解耦的独立层 ──
{
 const tps=catalog.teachingPoints||[];
 check(Array.isArray(tps)&&tps.length>0,'教学点层存在且非空');
 const kpIds=new Set(catalog.kps.map(k=>k.id));
 const lessonIds=new Set(catalog.lessons.map(l=>l.id));
 const badRef=tps.filter(t=>t.refs.some(r=>!kpIds.has(r)));
 check(badRef.length===0, `教学点的 refs 必须指向真实规则（异常 ${badRef.length} 条）`);
 const badLesson=tps.filter(t=>t.lessonId&&!lessonIds.has(t.lessonId));
 check(badLesson.length===0, `教学点的 lessonId 必须指向真实课文（异常 ${badLesson.length} 条）`);
 // covered 的定义必须自洽：有 refs 才 covered
 const inconsistent=tps.filter(t=>t.covered!==(t.refs.length>0));
 check(inconsistent.length===0, `covered 必须等价于「refs 非空」（异常 ${inconsistent.length} 条）`);
 const KINDS=new Set(['tense','clause','syntax','mood','collocation','morphology','agreement','degree','writing','ellipsis','information','pattern','review','synonym','register','numeral']);
 const badKind=tps.filter(t=>!KINDS.has(t.kind));
 check(badKind.length===0, `教学点 kind 越界：${[...new Set(badKind.map(t=>t.kind))].join(', ')}`);
 check(tps.every(t=>t.provenance==='derived'),'教学点 provenance 必须标 derived（表述自撰，只有事实采信）');
 report.teachingPoints=tps.length;
 report.teachingCovered=tps.filter(t=>t.covered).length;
}

// ── teachingFocus：册内 IDF × 引入册过滤 × 教材事实打底 ──
{
 const kpById=new Map(catalog.kps.map(k=>[k.id,k]));
 const empty=lessons.filter(l=>!l.focus||!l.focus.length);
 check(empty.length===0, `每课都应有 teachingFocus（空 ${empty.length} 课）`);
 // 核心约束：focus 里不得出现超前于本册的结构。旧实现（平铺 IDF）有 12.8% 的课踩这条。
 const early=[];
 for(const l of lessons) for(const id of (l.focus||[])){
  const k=kpById.get(id); if(k&&k.introduceBook!=null&&k.introduceBook>l.book) early.push(`${l.id}:${id}`);
 }
 check(early.length===0, `focus 不得含超前结构（${early.length} 处：${early.slice(0,3).join(', ')}）`);
 // focus 必须指向真实规则
 const badRef=lessons.flatMap(l=>(l.focus||[]).filter(id=>!kpById.has(id)).map(id=>`${l.id}:${id}`));
 check(badRef.length===0, `focus 必须指向真实规则（${badRef.length} 处）`);
 const src={}; for(const l of lessons) src[l.focusSource]=(src[l.focusSource]||0)+1;
 check(!src.undefined, '每课的 focusSource 都应有标记');
 report.focusSource=src;
}

// ── 课文导读：283 课原先共用聚类默认值，现在必须课课不同 ──
{
 const noSummary=lessons.filter(l=>!l.summary||l.summary.length<8);
 check(noSummary.length===0, `每课都应有导读（缺 ${noSummary.length} 课）`);
 const uniq=new Set(lessons.map(l=>l.summary));
 // 相同导读说明输入没起作用 —— 这正是原来「聚类默认值」的毛病
 check(uniq.size===lessons.length, `导读必须课课不同（${uniq.size}/${lessons.length} 条唯一）`);
 const noCanDo=lessons.filter(l=>!l.canDo||l.canDo.length<6);
 check(noCanDo.length===0, `每课都应有 canDo（缺 ${noCanDo.length} 课）`);
 const uniqC=new Set(lessons.map(l=>l.canDo));
 // canDo 用的是「体裁读法 + focus 清单」，focus 相同的课（尤其是相邻课）会撞。
 // 断言要抓的是「283 课共用聚类默认值」那个毛病，不是禁止巧合 —— 为撞而强行区别反而是造假。
 const ratio=uniqC.size/lessons.length;
 check(ratio>=0.95, `canDo 唯一率应 >= 95%，当前 ${(ratio*100).toFixed(1)}%（${uniqC.size}/${lessons.length}）`);
 const dupGroups=[...new Set([...uniqC].filter(x=>lessons.filter(l=>l.canDo===x).length>1))];
 report.canDoCollisions=dupGroups.length;
 const SOURCES=new Set(['editorial','derived-focus','cluster']);
 check(lessons.every(l=>SOURCES.has(l.summarySource)&&SOURCES.has(l.canDoSource)),'summarySource / canDoSource 取值在封闭词表内');
 report.uniqueSummaries=uniq.size;
 report.summarySource=Object.fromEntries([...new Set(lessons.map(l=>l.summarySource))].map(k=>[k,lessons.filter(l=>l.summarySource===k).length]));
}

// ── 测验题库：五条机械校验逐题跑一遍 ──
{
 const quiz=catalog.quiz||[];
 check(quiz.length>0,'题库非空');
 const kpById=new Map(catalog.kps.map(k=>[k.id,k]));
 const lessonById=new Map(lessons.map(l=>[l.id,l]));
 const focusOf=new Map(catalog.lessons.map(l=>[l.id,l.focus||[]]));
 const pool=catalog.kps;
 const fails={};
 for(const q of quiz){
  const l=lessonById.get(q.lessonId); if(!l){fails['课文不存在']=(fails['课文不存在']||0)+1;continue;}
  // 判据在**校验侧独立重算**，不采信题目自己的标记 —— 否则校验只是自证
  const foc=focusOf.get(q.lessonId)||[];
  const why=validateItem(q,l,kpById,pool,foc,vocabIdsOf(l,foc,kpById,stop,l.book));
  if(why) fails[why]=(fails[why]||0)+1;
 }
 check(Object.keys(fails).length===0, `题库必须全部通过五条机械校验：${JSON.stringify(fails).slice(0,140)}`);
 // 答案下标必须指向正确答案
 const badIdx=quiz.filter(q=>q.options[q.answerIndex]!==q.answer);
 check(badIdx.length===0, `answerIndex 必须指向 answer（异常 ${badIdx.length} 题）`);
 // 每题必须有 4 个互不相同的选项
 const badOpts=quiz.filter(q=>q.options.length<4||new Set(q.options).size<4);
 check(badOpts.length===0, `每题需 4 个互不相同的选项（异常 ${badOpts.length} 题）`);
 const kinds={}; for(const q of quiz) kinds[q.kind]=(kinds[q.kind]||0)+1;
 report.quizItems=quiz.length;
 report.quizLessons=new Set(quiz.map(q=>q.lessonId)).size;
 report.quizKinds=kinds;
}

const result={passed:true,checks,teachingPoints:catalog.teachingPoints?.length||0,...report,book4Aligned:b4Aligned.length,book4CorpusOnly:b4CorpusOnly.length,deadChunks:deadChunks.length,chunkCoverage:Number((100*coveredByChunk/wordHits).toFixed(1)),lessons:lessons.length,sentences:sentences.length,knowledgePoints:kp.size,matchedSpans:hitCount,paths:catalog.clusters.length,pairs:pairs.length,gzipFiles,scope:'Exact-source spans, IDs, counts, relationships, context links and source hashes. Does not assert linguistic annotation accuracy.'};
fs.writeFileSync(path.join(root,'docs/data-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
