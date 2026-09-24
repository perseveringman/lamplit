import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { rules, chunks, connective, stop } from './knowledge.mjs';
import { glossary, irregular } from './glossary.mjs';
import { clusters, bookMeta, primary, titles1, titles3, labels4, featured } from './editorial.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/data');
fs.mkdirSync(OUT,{recursive:true});
const filenames = ['new-concept-english-book-i(2).md','new-concept-english-book-ii(2).md','new-concept-english-book-iii(1).md','new-concept-english-book-iv(2).md'];
const segmenter = new Intl.Segmenter('en', { granularity:'sentence' });
const allLessons=[]; const allSentences=[]; const kps=new Map(); const sources=[]; const issues=[];
const wordRe=/[A-Za-z]+(?:['’][A-Za-z]+)?(?:-[A-Za-z]+)*/g;
const nameStop = new Set([...stop,...`I'm you're he's she's it's we're they're isn't aren't wasn't weren't don't doesn't didn't haven't hasn't hadn't couldn't can't won't wouldn't shouldn't mustn't let's i've you've we've they've i'll you'll he'll she'll we'll they'll that's there's what's how's who's where's mrs mr miss sir`.split(' ')]);
function write(name, data) { const str=JSON.stringify(data); fs.mkdirSync(path.dirname(path.join(OUT,name)),{recursive:true}); fs.writeFileSync(path.join(OUT,name),str); fs.writeFileSync(path.join(OUT,name+'.gz'),gzipSync(str,{level:9})); return {bytes:Buffer.byteLength(str),gzip:gzipSync(str).length}; }
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
    const sentence={id:sid,lessonId:id,index:sentences.length,text,wc:words.length,clauses:subordinate,tier:'example',hits:[],connectives:[],sourceLine:block.line,sourceEndLine:block.endLine||block.line,sourceKind:block.kind,sourceStart:block.kind==='body'?block.offset+start:start,sourceBlock:block.kind==='body'?body:block.text};
    for(const def of [...rules,...chunks]){def.regex.lastIndex=0;for(const m of text.matchAll(def.regex)){if(acceptRule(def,text,m))touch(def,sentence,m.index,m.index+m[0].length);}}
    const speaker=text.match(/^[^:]{1,28}:\s*/); const skipTo=speaker?.[0].length||0;
    for(const m of words){const word=m[0].toLowerCase().replace(/’/g,"'");if(word.length<3||nameStop.has(word)||m.index<skipTo)continue;
     const g=getGloss(word);const following=text.slice(m.index+m[0].length);const inline=following.match(/^[（(]([^()（）]*[\u3400-\u9fff][^()（）]*)[）)]/);
     if(inline){g.meaning=inline[1];g.provenance='source-inline';}
     touch({id:'w-'+word.replace(/[^a-z-]/g,'-'),type:'word',name:word,...g},sentence,m.index,m.index+m[0].length);
    }
    connective.lastIndex=0; sentence.connectives=[...text.matchAll(connective)].map(m=>[m.index,m.index+m[0].length]);
    const hasPattern=sentence.hits.some(([kp])=>kp.startsWith('p-'));
    sentence.tier=sentence.wc>=32||(sentence.wc>=23&&subordinate>=2)?'complex':hasPattern&&sentence.wc>=4&&sentence.wc<=25?'model':'example';
    sentence.hits.sort((a,b)=>a[1]-b[1]||b[2]-a[2]);
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
  const lesson={id,book:b+1,sequence:i+1,no:h.no,label:`${bookMeta[b].roman} · ${String(h.no).padStart(2,'0')}${duplicates.get(h.no)!==id?'②':''}`,title,titleZh,titleOrigin,sourceHeading:h.heading,sourceFile:filename,sourceLine:h.line+1,sourceEndLine:next,sourceBody:body,quality,scene:f.scene||cluster.scene,canDo:f.canDo||cluster.description,summary:f.summary||'',excerpt:sentences.find(s=>s.sourceKind==='body'&&s.wc>=5)?.text||sentences[0]?.text||'',genre,clusterIds,kpIds:byType,focus:(f.focus||[...grammar.slice(0,1),...pats.slice(0,1),...cs.slice(0,2)]).filter(x=>kpIds.includes(x)),wc:sentences.reduce((n,s)=>n+s.wc,0),sentenceCount:sentences.length,sentences};
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
for(let b=1;b<=4;b++)write(`books/${b}.json`,allLessons.filter(l=>l.book===b));
const sentenceIndex=allSentences.map(({id,lessonId,text,wc,clauses,tier})=>({id,lessonId,text,wc,clauses,tier}));
write('sentences.json',sentenceIndex);
write('pairs.json',pairs.slice(0,100));
const compactKps=[...kps.values()].map(({occurrences,...kp})=>kp);
const catalog={version:1,contentVersion:'nce-source-v1',books:bookMeta.map(b=>({...b,count:allLessons.filter(l=>l.book===b.id).length})),clusters:clusters.map(({keywords,...rest})=>rest),lessons:allLessons.map(({sentences,sourceBody,...l})=>l),kps:compactKps,stats:{lessons:allLessons.length,sentences:allSentences.length,kps:kps.size,clusters:clusters.length,byType:Object.fromEntries(['grammar','pattern','chunk','word'].map(t=>[t,compactKps.filter(k=>k.type===t).length])),tiers:Object.fromEntries(['model','complex','example'].map(t=>[t,allSentences.filter(s=>s.tier===t).length])),glossedWords:compactKps.filter(k=>k.type==='word'&&k.meaning).length,contextWords:compactKps.filter(k=>k.type==='word'&&!k.meaning).length,pairs:Math.min(100,pairs.length),hits:allSentences.reduce((n,s)=>n+s.hits.length,0)},defaultKP:'g-past',defaultLesson:'b2-001'};
const size=write('catalog.json',catalog);
write('integrity.json',{sources,issues,stats:catalog.stats,catalogSize:size,clusterCounts:clusters.map(c=>({id:c.id,count:c.lessonIds.length})),parser:'Physical source lines segmented with Intl.Segmenter; immutable original source retained. Header-body joins preserved without adding missing words.'});
fs.writeFileSync(path.join(ROOT,'docs','data-audit.json'),JSON.stringify({sources,issues,stats:catalog.stats,catalogSize:size},null,2));
console.log(JSON.stringify({stats:catalog.stats,catalogSize:size,emptyClusters:clusters.filter(c=>!c.lessonIds.length).map(c=>c.id),sourceIssues:issues.length},null,2));
