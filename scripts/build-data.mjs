import fs from 'node:fs';
import { introduceBookOf, bookRoleOf, introducedBy } from './book-roles.mjs';
import { metaOf } from './grammar-meta.mjs';
import { deriveTeachingPoints, coverageOf } from './teaching-points.mjs';
import { summaryOf, canDoOf } from './lesson-summary.mjs';
import { buildQuiz } from './quiz.mjs';
import { partsOf } from './structure-parts.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { rules, chunks, connective, stop } from './knowledge.mjs';
import { resolveSense } from './senses.mjs';
import { glossary, irregular } from './glossary.mjs';
import { clusters, bookMeta, primary, titles1, titles3, labels4, featured } from './editorial.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/data');
fs.mkdirSync(OUT,{recursive:true});
const filenames = ['new-concept-english-book-i(2).md','new-concept-english-book-ii(2).md','new-concept-english-book-iii(1).md','new-concept-english-book-iv(2).md'];
const segmenter = new Intl.Segmenter('en', { granularity:'sentence' });
// 第四册语料与官方 48 课版是不同版本（逐段偏移 +1…+12），officialNo 由内容对齐表给出。
// 不靠索引推断——这是实测出来的，见 corpora/nce/book4-alignment.json。
const ALIGN_PATH = path.join(ROOT, 'corpora/nce/book4-alignment.json');
const alignment = fs.existsSync(ALIGN_PATH) ? JSON.parse(fs.readFileSync(ALIGN_PATH, 'utf8')) : null;
const officialNoOf = new Map((alignment?.map || []).map((r) => [r.corpusSequence, r.officialNo]));
const allLessons=[]; const allSentences=[]; const kps=new Map(); const sources=[]; const issues=[];
const wordRe=/[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*/g;
const nameStop = new Set([...stop,...`I'm you're he's she's it's we're they're isn't aren't wasn't weren't don't doesn't didn't haven't hasn't hadn't couldn't can't won't wouldn't shouldn't mustn't let's i've you've we've they've i'll you'll he'll she'll we'll they'll that's there's what's how's who's where's mrs mr miss sir`.split(' ')]);
function write(name, data) { const str=JSON.stringify(data); fs.mkdirSync(path.dirname(path.join(OUT,name)),{recursive:true}); fs.writeFileSync(path.join(OUT,name),str); fs.writeFileSync(path.join(OUT,name+'.gz'),gzipSync(str,{level:9})); return {bytes:Buffer.byteLength(str),gzip:gzipSync(str).length}; }
// ── 语境释义层（Step 0–2）────────────────────────────────────────────
// 释义挂在「出现」上而不是「词」上：play 在第 3 句里是「戏剧」，在别处可能是「玩」。
// 词典缓存不进版本库，缺失时整层静默跳过，产物退回原来的词级释义。
const DICT_CACHE=path.join(ROOT,'.dict-cache/corpus-dict.json');
const dictEntries=fs.existsSync(DICT_CACHE)?JSON.parse(fs.readFileSync(DICT_CACHE,'utf8')).entries:null;
const dictLookup=dictEntries?(w)=>dictEntries[String(w||'').toLowerCase()]||null:null;
// LLM 批量标注的覆盖层（Step 5）。缺失时整层跳过。
// 来源优先级：原文旁注 > 语块 > LLM 语境判定 > 编辑词表单义 > 词典
const LLM_OVERRIDES=path.join(ROOT,'.llm/overrides.json');
const llmOverrides=fs.existsSync(LLM_OVERRIDES)?JSON.parse(fs.readFileSync(LLM_OVERRIDES,'utf8')):null;
const glossPools=new Map();
function internGloss(lessonId,text,method){
 let p=glossPools.get(lessonId); if(!p){p={glosses:[],gi:new Map(),methods:[],mi:new Map()};glossPools.set(lessonId,p);}
 let g=p.gi.get(text); if(g===undefined){g=p.glosses.length;p.glosses.push(text);p.gi.set(text,g);}
 let m=p.mi.get(method); if(m===undefined){m=p.methods.length;p.methods.push(method);p.mi.set(method,m);}
 return [g,m];
}
const senseStats={resolved:0,skipped:0,methods:{}};
function resolveSentenceSenses(sentence,defs){
 if(!dictLookup)return;
 const chunkSpans=sentence.hits.filter(h=>defs.get(h[0])?.type==='chunk');
 for(const hit of sentence.hits){
  const def=defs.get(hit[0]); if(!def||def.type!=='word')continue;
  const [id,start,end]=hit;
  const cover=chunkSpans.find(c=>c[1]<=start&&c[2]>=end&&(c[1]<start||c[2]>end));
  const covering=cover?defs.get(cover[0]):null;
  const llm=llmOverrides?.senses?.[sentence.id+'|'+id];
  if(llm&&!covering){
   const [g,m]=internGloss(sentence.lessonId,llm.gloss,'llm');
   hit[3]=g;hit[4]=m;senseStats.resolved++;senseStats.methods.llm=(senseStats.methods.llm||0)+1;continue;
  }
  const r=resolveSense({text:sentence.text,start,end,entry:dictLookup(def.name),coveringChunk:covering?{name:covering.name,meaning:covering.meaning||''}:null,editorial:def.meaning||null,lookup:dictLookup});
  if(r&&r.zh){const [g,m]=internGloss(sentence.lessonId,r.zh,r.method);hit[3]=g;hit[4]=m;senseStats.resolved++;senseStats.methods[r.method]=(senseStats.methods[r.method]||0)+1;}
  else senseStats.skipped++;
 }
}

/**
 * 裁决规则冲突。
 *   1. 同一 span 只保留 priority 最高的那一类（同 priority 全保留，避免误杀）
 *   2. 胜出规则若声明 excludes，则丢弃其 span 上与这些 id 重叠的命中
 */
function resolveRuleConflicts(matches){
 const bySpan=new Map();
 for(const m of matches){const key=m.start+'-'+m.end;if(!bySpan.has(key))bySpan.set(key,[]);bySpan.get(key).push(m);}
 const kept=[];
 for(const group of bySpan.values()){
  const top=Math.max(...group.map(g=>g.def.priority??50));
  const winners=group.filter(g=>(g.def.priority??50)===top);
  const excluded=new Set(winners.flatMap(w=>w.def.excludes||[]));
  kept.push(...winners.filter(w=>!excluded.has(w.def.id)));
 }
 if(!kept.length)return kept;
 // 应用 excludes：胜出规则会压制与它重叠的被排除规则
 const drop=new Set();
 for(const w of kept){
  const ex=w.def.excludes||[]; if(!ex.length)continue;
  for(const o of matches){ if(o===w)continue; if(!ex.includes(o.def.id))continue;
   if(o.start<w.end&&o.end>w.start)drop.add(o); }
 }
 return kept.filter(k=>!drop.has(k));
}
function getGloss(word){
 if(glossary[word]) return {meaning:glossary[word],provenance:'editorial-lexicon'};
 if(irregular[word] && glossary[irregular[word]]) return {meaning:`${irregular[word]} 的过去式／过去分词；${glossary[irregular[word]]}`,provenance:'editorial-morphology'};
 const bases=[];
 if(word.endsWith('ies')) bases.push(word.slice(0,-3)+'y');
 if(word.endsWith('ied')) bases.push(word.slice(0,-3)+'y');
 if(word.endsWith('s')&&!word.endsWith('ss')) bases.push(word.slice(0,-1));
 if(word.endsWith('es')) bases.push(word.slice(0,-2));
 if(word.endsWith('ing')) bases.push(word.slice(0,-3)+'e',word.slice(0,-3),word.slice(0,-4));
 if(word.endsWith('ed')) bases.push(word.slice(0,-1),word.slice(0,-2),word.slice(0,-3));
 const base=bases.find(x=>x.length>2 && glossary[x]);
 return base?{meaning:`${base} 的词形；${glossary[base]}`,provenance:'editorial-morphology',lemma:base}:{meaning:'',provenance:'context'};
}

function acceptRule(def,text,m){
 if(def.id!=='g-past'&&def.id!=='g-present')return true;
 const before=text.slice(0,m.index).toLowerCase(),after=text.slice(m.index+m[0].length).toLowerCase();const token=m[0].toLowerCase();
 if(def.id==='g-past'){
  if(token==='left'&&/(?:\b(?:on|to|at)\s+(?:the|my|your|his|her|our|their)|\b(?:turn|turned|keep|go))\s*$/.test(before))return false;
  if(token==='left'&&/^[-\s]+(?:hand|side|wing)\b/.test(after))return false;
  if(token==='read'&&!/\b(?:yesterday|last|ago|then|once|earlier|after|before)\b/i.test(text))return false;
  if(!['was','were','did'].includes(token)&&/(?:\b(?:can|could|will|would|shall|should|may|might|must|to|have|has|had|am|is|are|was|were|be|been|being)|'(?:ve|s))\s+(?:(?:not|never|ever|just|already|often|always|recently|still|only|also|carefully|usually|fully|probably)\s+){0,3}$/.test(before))return false;
  if(['was','were'].includes(token)&&/^\s+(?:(?:not|still|always|busily)\s+)?[a-z]+ing\b/.test(after))return false;
  if(token==='had'&&/^\s+(?:(?:not|just|already|never|ever|nearly|always|often|recently)\s+){0,3}(?:been|done|gone|seen|known|found|made|taken|given|written|spoken|bought|thought|told|built|sent|left|lost|kept|held|heard|caught|read|paid|put|set|won|sold|shown|grown|become|begun|broken|driven|eaten|fallen|forgotten|flown|got|hidden|run|risen|stolen|stood|swum|thrown|worn|[a-z]+ed)\b/.test(after))return false;
 }
 if(def.id==='g-present'&&['am','is','are'].includes(token)&&/^\s+(?:(?:not|still|always|now)\s+)?[a-z]+ing\b/.test(after))return false;
 return true;
}

function touch(def,sentence,start,end){
 let kp=kps.get(def.id);
 if(!kp) {kp={id:def.id,type:def.type,name:def.name,meaning:def.meaning||'',provenance:def.provenance,parent:def.parent||null,lemma:def.lemma||null,lessonIds:new Set(),occurrences:[],related:[],contains:[],degree:0}; kps.set(kp.id,kp);}
 if(kp.occurrences.some(o=>o[0]===sentence.id&&o[1]===start&&o[2]===end))return;
 kp.lessonIds.add(sentence.lessonId); kp.occurrences.push([sentence.id,start,end]); sentence.hits.push([kp.id,start,end]);
}
for(let b=0;b<4;b++){
 const filename=filenames[b];const raw=fs.readFileSync(path.join(ROOT,'sources',filename),'utf8');
 sources.push({book:b+1,filename,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 const lines=raw.split(/\r?\n/); const headings=[];
 lines.forEach((line,index)=>{const m=line.match(/^## Lesson\s+(\d+)(?::\s*(.*))?$/);if(m)headings.push({line:index,no:+m[1],heading:m[2]||''});});
 const duplicates=new Map();
 headings.forEach((h,i)=>{
  const id=`b${b+1}-${String(i+1).padStart(3,'0')}`;const next=headings[i+1]?.line??lines.length;
  let title=h.heading,lead='',titleZh='',titleOrigin='source';const quality=[];
  if(b===0||b===2){const candidate=(b===0?titles1:titles3)[i];if(candidate&&title.startsWith(candidate)){lead=title.slice(candidate.length).trim();title=candidate;}else if(title.length>65 || /^(?:By now|Susan:)/.test(title)){lead=title;title=`Lesson ${h.no}`;titleOrigin='editorial-label';}}
  if(b===3){lead=title;title=labels4[i]||`阅读 ${i+1}`;titleOrigin='editorial-label';}
  // Book II sometimes places the Chinese title before the first English sentence.
  if(b===1){const ch=title.search(/[\u3400-\u9fff]/);if(ch>=0){titleZh=title.slice(ch).trim();title=title.slice(0,ch).trim();}}
  if(!title.trim())title=`Lesson ${h.no}`;
  if(lead && /[A-Za-z]/.test(lead)){
   quality.push('原文件标题与首句相连；此处保留可见内容。');
   if(lead.length>=60 && !/[.!?。？！．]$/.test(lead)) quality.push('原文件首句可能截断，未补写。');
  }
  if(duplicates.has(h.no)){quality.push('原文件课号重复，按收录顺序区分。');issues.push({lessonId:id,kind:'duplicate-number',sourceNo:h.no,first:duplicates.get(h.no)});}else duplicates.set(h.no,id);
  const bodyLines=lines.slice(h.line+1,next);while(bodyLines.at(-1)?.trim()===''||bodyLines.at(-1)?.trim()==='---')bodyLines.pop();
  const body=bodyLines.join('\n');
  const bodyStartLine=h.line+2;
  const bodyOffsets=[];let accumulated=0;for(const line of bodyLines){bodyOffsets.push(accumulated);accumulated+=line.length+1;}
  const blocks=[];
  if(lead)blocks.push({text:lead,line:h.line+1,kind:'heading',offset:0});
  // Each physical source line stays a traceable block. Tiny abbreviation/punctuation fragments attach to the previous block.
  bodyLines.forEach((text,j)=>{
   if(!text.trim()||text.trim()==='---')return;
   if(!/[a-z]/i.test(text)){
    if(/[\u3400-\u9fff]/.test(text)&&!titleZh){titleZh=text.trim();return;}
    if(blocks.length&&blocks.at(-1).kind==='body'){const previous=blocks.at(-1);previous.text=body.slice(previous.offset,bodyOffsets[j]+text.length);previous.endLine=bodyStartLine+j;}return;
   }
   if(/^[A-Za-z]\.?$/.test(text.trim())&&blocks.length&&blocks.at(-1).kind==='body'){const previous=blocks.at(-1);previous.text=body.slice(previous.offset,bodyOffsets[j]+text.length);previous.endLine=bodyStartLine+j;return;}
   blocks.push({text,line:bodyStartLine+j,kind:'body',offset:bodyOffsets[j]});
  });
  const sentences=[];
  blocks.forEach(block=>{
   for(const part of segmenter.segment(block.text)){
    const start=part.index+part.segment.length-part.segment.trimStart().length;
    const text=part.segment.trim(); if(!text)continue;
    if(!/[A-Za-z]/.test(text)&&sentences.length){const previous=sentences.at(-1);if(block.kind==='body'&&previous.sourceKind==='body'){const end=block.offset+part.index+part.segment.trimEnd().length;previous.text=body.slice(previous.sourceStart,end);previous.sourceEndLine=block.endLine||block.line;}continue;}
    if(!/[A-Za-z]/.test(text))continue;
    const sid=`${id}-s${String(sentences.length+1).padStart(3,'0')}`;
    const words=[...text.matchAll(wordRe)];
    const subordinate=(text.match(/\b(?:who|whom|which|whose|that|because|although|though|when|while|if|unless|until|whereas|whether)\b/gi)||[]).length;
    const sentence={id:sid,lessonId:id,index:sentences.length,text,wc:words.length,clauses:subordinate,hits:[],connectives:[],sourceLine:block.line,sourceEndLine:block.endLine||block.line,sourceKind:block.kind,sourceStart:block.kind==='body'?block.offset+start:start,sourceBlock:block.kind==='body'?body:block.text};
    // 规则命中先收集再裁决：语法/句型之间有优先级与互斥关系（见 knowledge.mjs 的 rule()）。
// 语块单独处理——它是紧致的语义单元，不参与语法裁决。
const grammarMatches=[];const patternMatches=[];
for(const def of rules){def.regex.lastIndex=0;for(const m of text.matchAll(def.regex)){if(!acceptRule(def,text,m))continue;
 const rec={def,start:m.index,end:m.index+m[0].length};(def.type==='pattern'?patternMatches:grammarMatches).push(rec);}}
const winners=resolveRuleConflicts([...patternMatches,...grammarMatches]);
for(const w of winners)touch(w.def,sentence,w.start,w.end);
for(const def of chunks){def.regex.lastIndex=0;for(const m of text.matchAll(def.regex)){if(acceptRule(def,text,m))touch(def,sentence,m.index,m.index+m[0].length);}}
    const speaker=text.match(/^[^:]{1,28}:\s*/); const skipTo=speaker?.[0].length||0;
    for(const m of words){const word=m[0].toLowerCase().replace(/’/g,"'");if(word.length<3||nameStop.has(word)||m.index<skipTo)continue;
     const g=getGloss(word);const following=text.slice(m.index+m[0].length);const inline=following.match(/^[（(]([^()（）]*[\u3400-\u9fff][^()（）]*)[）)]/);
     if(inline){g.meaning=inline[1];g.provenance='source-inline';}
     touch({id:'w-'+word.replace(/[^a-z-]/g,'-'),type:'word',name:word,...g},sentence,m.index,m.index+m[0].length);
    }
    connective.lastIndex=0; sentence.connectives=[...text.matchAll(connective)].map(m=>[m.index,m.index+m[0].length]);
    const hasPattern=sentence.hits.some(([kp])=>kp.startsWith('p-'));

    sentence.hits.sort((a,b)=>a[1]-b[1]||b[2]-a[2]);
    resolveSentenceSenses(sentence,kps);
    const analysis=llmOverrides?.analyses?.[sentence.id];
    if(analysis)sentence.analysis=analysis;
    // hit 载荷按类型分派：只有 grammar 需要「本句体现」（word 是义项，chunk/pattern 挂在知识点上）。
  // 按 start 索引，只记能确定性切出来的；切不出的留空，不猜。
  {
   const parts = {};
   for (const h of sentence.hits) {
    if (!h[0].startsWith('g-')) continue;
    const p = partsOf(h[0], text.slice(h[1], h[2]));
    if (p) parts[h[1]] = p;
   }
   if (Object.keys(parts).length) sentence.structureParts = parts;
  }
  sentences.push(sentence);allSentences.push(sentence);
   }
  });
  let clusterId=primary[b+1]?.[i]||'information';
  const cluster=clusters.find(c=>c.id===clusterId);
  if(!cluster)throw Error('Invalid cluster '+id+':'+clusterId);
  const f=featured[id]||{};
  const kpIds=[...new Set(sentences.flatMap(s=>s.hits.map(x=>x[0])))];
  const byType = ['grammar','pattern','chunk','word'].flatMap(type=>kpIds.filter(id=>kps.get(id).type===type));
  const grammar=byType.filter(x=>x.startsWith('g-'));const pats=byType.filter(x=>x.startsWith('p-'));const cs=byType.filter(x=>x.startsWith('c-'));
  const extra=clusters.filter(c=>c.id!==clusterId).map(c=>({id:c.id,score:(body.match(new RegExp('\\b(?:'+c.keywords+')\\b','gi'))||[]).length})).sort((a,b)=>b.score-a.score)[0];
  const clusterIds=[clusterId];if(extra?.score>=4)clusterIds.push(extra.id);
  clusterIds.forEach(c=>clusters.find(x=>x.id===c).lessonIds.push(id));
  const genre=b===0&&(body.match(/\?|:\s/g)||[]).length>4?'对话':b===3?'议论 / 说明':cluster.stage==='思辨'||['process','information'].includes(clusterId)?'说明':'叙事';
  const lesson={id,book:b+1,sequence:i+1,no:h.no,label:`${bookMeta[b].roman} · ${String(h.no).padStart(2,'0')}${duplicates.get(h.no)!==id?'②':''}`,title,titleZh,titleOrigin,sourceHeading:h.heading,sourceFile:filename,sourceLine:h.line+1,sourceEndLine:next,sourceBody:body,quality,scene:f.scene||cluster.scene,canDo:f.canDo||cluster.description,summary:f.summary||'',excerpt:sentences.find(s=>s.sourceKind==='body'&&s.wc>=5)?.text||sentences[0]?.text||'',genre,clusterIds,kpIds:byType,focus:(f.focus||[]).filter(x=>kpIds.includes(x)),editorialFocus:!!f.focus,editorialCanDo:!!f.canDo,wc:sentences.reduce((n,s)=>n+s.wc,0),sentenceCount:sentences.length,sentences,glosses:glossPools.get(id)?.glosses||[],glossMethods:glossPools.get(id)?.methods||[],...(b+1===4 ? {officialNo: officialNoOf.get(i+1) ?? null, corpusOnly: !officialNoOf.has(i+1)} : {})};
  if(quality.length)issues.push({lessonId:id,kind:'source-format',messages:quality});
  allLessons.push(lesson);
 });
 if(headings.length!==[72,96,60,60][b])throw Error('Wrong book count: '+filename);
}
const lessonMap=new Map(allLessons.map(x=>[x.id,x]));
for(const kp of kps.values()){
 kp.lessonIds=[...kp.lessonIds].sort();kp.frequency=kp.occurrences.length;
 // Exact lexical containment, never invented synonym/antonym relations.
 if(kp.type==='chunk'||kp.type==='pattern'){
  kp.contains=[...new Set((kp.name.toLowerCase().match(/[a-z]{3,}/g)||[]).map(w=>'w-'+w).filter(w=>kps.has(w)&&!nameStop.has(w.slice(2))))];
 }
 if(kp.lemma&&kps.has('w-'+kp.lemma))kp.contains.push('w-'+kp.lemma);
 const candidates=new Map();
 for(const lid of kp.lessonIds)for(const id of lessonMap.get(lid).kpIds){if(id===kp.id)continue;const other=kps.get(id);const priority={grammar:3,pattern:4,chunk:4,word:1}[other.type];const score=priority/Math.sqrt(other.lessonIds.length||1);candidates.set(id,(candidates.get(id)||0)+score);}
 kp.degree=candidates.size;
 const ranked=[...candidates].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 // Balanced neighborhood: no single type fills the entire graph.
 kp.related=['grammar','pattern','chunk','word'].flatMap(t=>ranked.filter(([id])=>kps.get(id).type===t).slice(0,6).map(([id])=>id));
 if(kp.parent&&!kps.has(kp.parent))kp.parent=null;
}
const pairs=[];
for(let i=0;i<allLessons.length;i++)for(let j=i+1;j<allLessons.length;j++){
 const a=allLessons[i],b=allLessons[j];const bs=new Set(b.kpIds);const shared=a.kpIds.filter(id=>bs.has(id));if(shared.length<3)continue;
 shared.sort((a,b)=>({grammar:0,pattern:1,chunk:2,word:3}[kps.get(a).type]-{grammar:0,pattern:1,chunk:2,word:3}[kps.get(b).type])||kps.get(a).lessonIds.length-kps.get(b).lessonIds.length);
 pairs.push({a:a.id,b:b.id,count:shared.length,kpIds:shared,overlap:shared.length/(a.kpIds.length+b.kpIds.length-shared.length)});
}
pairs.sort((a,b)=>b.count-a.count||b.overlap-a.overlap||a.a.localeCompare(b.a)||a.b.localeCompare(b.b));
const contextBuckets=Array.from({length:32},()=>({}));
const bucket = id=>[...id].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,0)%32;
for(const kp of kps.values())contextBuckets[bucket(kp.id)][kp.id]=kp.occurrences;
contextBuckets.forEach((x,i)=>write(`contexts/${i}.json`,x));
// ── teachingFocus：册内 IDF × 引入册过滤 ──
// 旧实现是「语法取第一个、句型取第一个、语块取两个」——与教学目的无关，只是数组下标。
// 新实现两条约束：
//   1. 只保留 introduceBook <= 本课所在册 的规则。教材还没教的结构不可能是这一课的重点
//      （早先用平铺 IDF 时，12.8% 的课被选出了超前于本册的结构）。
//   2. 按**册内** IDF 排序。全局 IDF 会把第一册的基础结构抬高到后册的重点里去；
//      册内 IDF 只问「在本册里，这个结构是不是少见」，这才是"本课在教它"的信号。
// 编辑覆盖（editorial.mjs 里的 focus）优先，不参与计算。
const FOCUS_N = 3;
{
 // 教材事实优先：C4 已核对的教学点直接进 focus 前排。
 // 统计能告诉我们「什么罕见」，但告诉不了「这一课要教什么」——后者只有教材事实能给。
 const verifiedByLesson = new Map();
 {
  const fp = path.join(ROOT, 'corpora/nce/teaching-facts.json');
  if (fs.existsSync(fp)) {
   for (const pt of JSON.parse(fs.readFileSync(fp, 'utf8')).points || []) {
    if (!pt.corpusLesson) continue;
    const arr = verifiedByLesson.get(pt.corpusLesson) || [];
    arr.push(pt.kpId); verifiedByLesson.set(pt.corpusLesson, arr);
   }
  }
 }
 for (const bk of [1, 2, 3, 4]) {
  const inBook = allLessons.filter((l) => l.book === bk);
  if (!inBook.length) continue;
  const N = inBook.length;
  const df = new Map();
  for (const l of inBook) {
   for (const id of (l.kpIds || []).filter((x) => x.startsWith('g-') || x.startsWith('p-'))) df.set(id, (df.get(id) || 0) + 1);
  }
  for (const l of inBook) {
   if (l.editorialFocus) { l.focusSource = 'editorial'; continue; }
   // 本课每条规则的命中次数
   const hits = new Map();
   for (const s of l.sentences) for (const h of s.hits) hits.set(h[0], (hits.get(h[0]) || 0) + 1);
   const ranked = (l.kpIds || []).filter((x) => x.startsWith('g-') || x.startsWith('p-'))
    .map((id) => {
     const kp = kps.get(id);
     if (!introducedBy(id, bk, l.no)) return null;         // 教材还没教到（课级优先，册级兜底）
     const idf = Math.log(N / (df.get(id) || 1));
     const n = hits.get(id) || 1;
     return { id, score: idf * Math.log(1 + n) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .map((x) => x.id);
   const seeded = (verifiedByLesson.get(l.id) || []).filter((id) => kps.has(id));
   l.focus = [...new Set([...seeded, ...ranked])].slice(0, FOCUS_N);
   l.focusSource = seeded.length ? 'textbook+idf' : 'idf';
  }
 }
}

// ── 课文导读（C5）：模板化生成，写描述不写承诺 ──
// 用 focus（已可信）作为输入，替换掉 283 课共用的聚类默认 canDo。
{
 // 句型名形如「one of the … · 其中之一」，嵌进句子里太啰嗦，只取英文形式那半
 const nameOf = (id) => { const n = kps.get(id)?.name || id; return n.includes(' · ') ? n.split(' · ')[0].trim() : n; };
 for (const l of allLessons) {
  const focusNames = (l.focus || []).map(nameOf).slice(0, 3);
  if (!l.summary) { l.summary = summaryOf(l, focusNames); l.summarySource = 'derived-focus'; }
  else l.summarySource = 'editorial';
  if (!l.editorialCanDo) { const c2 = canDoOf(l, focusNames); if (c2) { l.canDo = c2; l.canDoSource = 'derived-focus'; } else l.canDoSource = 'cluster'; }
  else l.canDoSource = 'editorial';
 }
}

for(let b=1;b<=4;b++)write(`books/${b}.json`,allLessons.filter(l=>l.book===b));
const sentenceIndex=allSentences.map(({id,lessonId,text,wc,clauses})=>({id,lessonId,text,wc,clauses}));
write('sentences.json',sentenceIndex);
write('pairs.json',pairs.slice(0,100));
const compactKps=[...kps.values()].map(({occurrences,...kp})=>{
 const entry=kp.type==='word'&&dictLookup?dictLookup(kp.name):null;
 if(!entry||kp.type!=='word')return kp;
 const zhSenses=entry.senses.filter(x=>x.zh.length);
 const core=zhSenses[0]||null;
 return {...kp,
  lemma:kp.lemma||(entry.lemma!==kp.name?entry.lemma:null),
  coreSense:core?core.zh.slice(0,2).join('；'):null,
  corePos:core?core.pos:null,
  enDefinition:core&&core.en.length?core.en[0]:(entry.senses.find(x=>x.en.length)?.en[0]||null),
  wordFamily:entry.forms&&entry.forms.length?entry.forms.slice(0,4):null,
  collins:entry.collins||0,
  examTags:entry.tags&&entry.tags.length?entry.tags:null};
});
// ── 每册角色：引入册来自教材事实（见 scripts/book-roles.mjs），不是统计推断 ──
{
 const lessonBook=new Map(allLessons.map(l=>[l.id,l.book]));
 for(const kp of compactKps){
  kp.introduceBook=introduceBookOf(kp.id);
  const books=new Set((kp.lessonIds||[]).map(id=>lessonBook.get(id)));
  const roles={};
  for(const b of [1,2,3,4]){const r=bookRoleOf(kp.id,b,books.has(b)); if(r)roles[b]=r;}
  kp.bookRoles=roles;
  Object.assign(kp, metaOf(kp.id, kp.type, kp.introduceBook));
 }
}
// ── 教学点：教材事实经语料验证后成为实体，与语言对象（规则）解耦 ──
const teachingPoints = (() => {
  const factPath = path.join(ROOT, 'corpora/nce/teaching-facts.json');
  if (!fs.existsSync(factPath)) return [];
  const facts = JSON.parse(fs.readFileSync(factPath, 'utf8'));
  const kpById = new Map(compactKps.map((k) => [k.id, k]));
  const lessonById = new Map(allLessons.map((l) => [l.id, l]));
  return deriveTeachingPoints(facts, kpById, lessonById);
})();
const teachingCoverage = coverageOf(teachingPoints);

// ── 测验题库（D2）：只从课文生成，且只考该课 teachingFocus 覆盖的知识点 ──
// 没有 teachingFocus 这一层约束，题库会考"文本里恰好出现的结构"而不是"这一课教的东西"。
const quiz = (() => {
 const kpById = new Map(compactKps.map((k) => [k.id, k]));
 const out = [];
 for (const l of allLessons) {
  const focus = (l.focus || []).filter((id) => kpById.has(id));
  if (!focus.length) continue;
  out.push(...buildQuiz(l, focus, kpById, compactKps, l.book, stop));
 }
 return out;
})();

const catalog={version:1,contentVersion:'nce-source-v1',books:bookMeta.map(b=>({...b,
  count:allLessons.filter(l=>l.book===b.id).length,
  ...(b.id===4 && alignment ? {
   officialLessonCount: alignment.officialLessonCount,
   corpusLessonCount: alignment.corpusLessonCount,
   alignedCount: alignment.alignedCount,
   corpusOnlyCount: alignment.corpusOnlySequences.length,
   officialMissingNumbers: alignment.officialMissingNumbers,
   alignmentMethod: alignment.method,
  } : {}),
  ...(b.id===1 ? {officialLessonCount:144, corpusLessonCount:72, coverMainOnly:true} : {}),
 })),clusters:clusters.map(({keywords,...rest})=>rest),lessons:allLessons.map(({sentences,sourceBody,glosses,glossMethods,...l})=>l),teachingPoints,teachingCoverage,quiz,kps:compactKps,stats:{lessons:allLessons.length,sentences:allSentences.length,kps:kps.size,clusters:clusters.length,byType:Object.fromEntries(['grammar','pattern','chunk','word'].map(t=>[t,compactKps.filter(k=>k.type===t).length])),glossedWords:compactKps.filter(k=>k.type==='word'&&k.meaning).length,contextWords:compactKps.filter(k=>k.type==='word'&&!k.meaning).length,pairs:Math.min(100,pairs.length),hits:allSentences.reduce((n,s)=>n+s.hits.length,0),senseResolved:senseStats.resolved,senseSkipped:senseStats.skipped,llmSenses:Object.keys(llmOverrides?.senses||{}).length,llmAnalyses:Object.keys(llmOverrides?.analyses||{}).length,book4Aligned:allLessons.filter(l=>l.officialNo).length,book4CorpusOnly:allLessons.filter(l=>l.corpusOnly).length,kpWithIntroduceBook:compactKps.filter(k=>k.introduceBook!==null).length,kpWithFormula:compactKps.filter(k=>k.formula).length,quizItems:quiz.length,kpWithLevel:compactKps.filter(k=>k.level).length},defaultKP:'g-past',defaultLesson:'b2-001'};
const size=write('catalog.json',catalog);
write('integrity.json',{sources,issues,stats:catalog.stats,catalogSize:size,clusterCounts:clusters.map(c=>({id:c.id,count:c.lessonIds.length})),parser:'Physical source lines segmented with Intl.Segmenter; immutable original source retained. Header-body joins preserved without adding missing words.'});
fs.writeFileSync(path.join(ROOT,'docs','data-audit.json'),JSON.stringify({sources,issues,stats:catalog.stats,catalogSize:size},null,2));
console.log(JSON.stringify({stats:catalog.stats,catalogSize:size,emptyClusters:clusters.filter(c=>!c.lessonIds.length).map(c=>c.id),sourceIssues:issues.length},null,2));
