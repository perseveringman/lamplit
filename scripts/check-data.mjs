import fs from 'node:fs';
import path from 'node:path';
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
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
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
const result={passed:true,checks,lessons:lessons.length,sentences:sentences.length,knowledgePoints:kp.size,matchedSpans:hitCount,paths:catalog.clusters.length,pairs:pairs.length,gzipFiles,scope:'Exact-source spans, IDs, counts, relationships, context links and source hashes. Does not assert linguistic annotation accuracy.'};
fs.writeFileSync(path.join(root,'docs/data-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
