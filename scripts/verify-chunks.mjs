// 语块候选验证：候选必须真的在语料里出现，否则就是死条目。
//
// 现有 275 个语块里积攒了 47 个死条目（322 定义 → 275 生效），其中 40 个
// 连新概念四册都没出现过。这个脚本就是为了让那种事情不会再发生。
//
// 用法：npm run chunks:verify
import fs from 'node:fs';
import path from 'node:path';
import { CHUNK_CANDIDATES } from './chunk-candidates.mjs';
// 刻意用「发货的那张表」而不是现算一张：验证的必须是真正上线的东西，
// 否则验证通过而线上匹配不到，就是假绿。
import { VERB_FORMS } from './verb-forms.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.dict-cache/corpus-dict.json');

/** 解析 'name|meaning' 清单，忽略注释与空行。 */
export function parseChunkList(text) {
  const out = [];
  const seen = new Set();
  for (const raw of String(text).split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    const at = line.indexOf('|');
    if (at < 0) continue;
    const name = line.slice(0, at).trim().toLowerCase();
    const meaning = line.slice(at + 1).trim();
    if (!name || !meaning || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, meaning });
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 占位符展开：候选里写的 one's / sb / sth 在语料里从来不会字面出现，
// 不展开就会把 at one's best、do sb a favour 这类真语块误判成死条目。
const PLACEHOLDERS = [
  [/\bone's\b/g, '(?:my|your|his|her|its|our|their|one\'s)'],
  [/\bsb's\b/g, '(?:my|your|his|her|its|our|their)'],
  [/\bsb\b/g, '(?:me|you|him|her|us|them|someone|somebody)'],
  [/\bsth\b/g, '(?:something|anything|nothing|it)'],
  [/\boneself\b/g, '(?:myself|yourself|himself|herself|itself|ourselves|themselves)'],
];

/** 把候选名展开成可匹配的正则片段源串（仍带占位符替换）。 */
function expandPlaceholders(name) {
  let out = escapeRe(name);
  for (const [re, alt] of PLACEHOLDERS) out = out.replace(re, alt);
  return out;
}

/**
 * 用 ECDICT 的 exchange 生成动词变形正则。
 * 现有实现手工维护了 30 个动词，漏掉了 wake/hang/ring/sell/cut/hide/lay/rise…
 * 于是 `wake up` 定义过却匹配不到 `woke up`。
 */
export function buildFormTable(entries, heads) {
  const table = {};
  for (const head of heads) {
    const entry = entries[head];
    if (!entry) continue;
    const forms = new Set([head, ...(entry.forms || [])]);
    table[head] = [...forms].filter((f) => /^[a-z][a-z'-]*$/.test(f)).sort((a, b) => b.length - a.length);
  }
  return table;
}

/** 为一个语块生成匹配正则。 */
export function chunkRegex(name, formTable) {
  const parts = name.split(' ');
  const head = parts[0];
  const rest = parts.slice(1);
  if (!rest.length) return null;
  const headAlt = formTable[head] ? `(?:${formTable[head].map(escapeRe).join('|')})` : expandPlaceholders(head);
  // be 后面常插副词（"am very proud of"），不留槽位会把整类 be+形容词+介词 误判成死条目
  const gap = head === 'be' ? '\\s+(?:(?:very|quite|so|really|rather|extremely|always|never|still|just|not|also|too|most|more|only|already)\\s+)*' : '\\s+';
  return new RegExp(`(?<![a-z])${headAlt}${gap}${rest.map(expandPlaceholders).join('\\s+')}(?![a-z])`, 'gi');
}

function main() {
  if (!fs.existsSync(CACHE)) throw new Error('缺少词典缓存，请先运行 npm run dict:cache');
  const entries = JSON.parse(fs.readFileSync(CACHE, 'utf8')).entries;

  // 语料
  const sentences = [];
  for (const book of [1, 2, 3, 4]) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/books/${book}.json`), 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const s of lesson?.sentences || []) {
        if (s.text) sentences.push({ lesson: lesson.id, text: s.text });
      }
    }
  }

  // 现有清单
  const knowledge = fs.readFileSync(path.join(ROOT, 'scripts/knowledge.mjs'), 'utf8');
  const existingBlock = knowledge.match(/const chunkText = `([\s\S]*?)`;/);
  const existing = existingBlock ? parseChunkList(existingBlock[1]) : [];

  const candidates = parseChunkList(CHUNK_CANDIDATES);
  const all = [...existing, ...candidates];
  const seen = new Set();
  const unique = all.filter((c) => !seen.has(c.name) && seen.add(c.name));

  // 变形表直接用发货的那张
  const formTable = {};
  for (const [head, joined] of Object.entries(VERB_FORMS)) formTable[head] = joined.split('|');
  const generatedHeads = Object.keys(formTable).length;
  void entries;

  const alive = [];
  const dead = [];
  for (const chunk of unique) {
    const re = chunkRegex(chunk.name, formTable);
    if (!re) { dead.push({ ...chunk, hits: 0, lessons: 0 }); continue; }
    let hits = 0;
    const lessons = new Set();
    for (const s of sentences) {
      re.lastIndex = 0;
      const m = s.text.match(re);
      if (m) { hits += m.length; lessons.add(s.lesson); }
    }
    if (hits > 0) alive.push({ ...chunk, hits, lessons: lessons.size });
    else dead.push({ ...chunk, hits: 0, lessons: 0 });
  }

  alive.sort((a, b) => b.hits - a.hits);
  const totalHits = alive.reduce((a, c) => a + c.hits, 0);

  console.log(`语料句子        ${sentences.length}`);
  console.log(`现有清单        ${existing.length}`);
  console.log(`新增候选        ${candidates.length}`);
  console.log(`去重后合计      ${unique.length}`);
  console.log(`变形表覆盖首词  ${generatedHeads}`);
  console.log();
  console.log(`✅ 语料中确有出现  ${alive.length}`);
  console.log(`❌ 零匹配（死条目）${dead.length}`);
  console.log(`   总命中次数      ${totalHits}`);
  console.log();
  if (dead.length) {
    console.log('=== 零匹配条目（不应入册）===');
    console.log('  ' + dead.map((d) => d.name).join(' | '));
    console.log();
  }

  const byLesson = { 1: 0, 2: 0, 3: 0 };
  for (const a of alive) { if (a.lessons >= 5) byLesson[3]++; else if (a.lessons >= 2) byLesson[2]++; else byLesson[1]++; }
  console.log('=== 按复用程度 ===');
  console.log(`  跨 ≥5 课   ${byLesson[3]}`);
  console.log(`  跨 2–4 课  ${byLesson[2]}`);
  console.log(`  仅 1 课    ${byLesson[1]}`);
  console.log();

  const out = path.join(ROOT, '.dict-cache/chunks-verified.txt');
  fs.writeFileSync(out, alive.map((c) => `${c.name}|${c.meaning}`).join('\n') + '\n');
  console.log(`已验证清单写入 ${path.relative(ROOT, out)}（${alive.length} 条）`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main();
