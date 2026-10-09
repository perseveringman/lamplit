// 从完整 ECDICT 中抽取「本语料实际用到的词」，生成小体积缓存。
//
// 为什么要有这一步：
//   - 完整库 812MB，data:build 不该每次都全量扫描
//   - 抽出来的子集只有几千条，可以单独审阅
//   - 词典数据库不进版本库，这个缓存也不进；最终展示用的释义会落到 public/data/
//
// 用法：npm run dict:cache
import fs from 'node:fs';
import path from 'node:path';
import { openDict, DEFAULT_DB } from './ecdict.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '.dict-cache/corpus-dict.json');

/** 收集语料里出现过的所有词形，并区分「知识点词条」与「正文全部词形」。 */
function corpusWords() {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
  const kpWords = new Set();
  for (const kp of catalog.kps) {
    if (kp.type !== 'word') continue;
    kpWords.add(kp.name.toLowerCase());
  }
  const tokens = new Set(kpWords);
  for (const book of [1, 2, 3, 4]) {
    const file = path.join(ROOT, `public/data/books/${book}.json`);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const s of lesson?.sentences || []) {
        for (const token of String(s.text || '').toLowerCase().match(/[a-z][a-z'-]*/g) || []) {
          if (token.length > 1) tokens.add(token);
        }
      }
    }
  }
  return { kpWords, tokens, all: [...tokens].sort() };
}

/** 所有格与连字符是源文里最常见的两种「查不到」，先剥离再查一次。 */
function variants(word) {
  const out = [word];
  const stripped = word.replace(/['’]s?$/, '');
  if (stripped && stripped !== word) out.push(stripped);
  if (word.includes('-')) {
    for (const part of word.split('-')) if (part.length > 1) out.push(part);
  }
  if (word.endsWith("'") || word.endsWith('’')) out.push(word.slice(0, -1));
  return out;
}

function main() {
  const { kpWords, all } = corpusWords();
  const dict = openDict();
  const entries = {};
  const missing = [];
  const kpMiss = [];
  let viaVariant = 0;

  for (const word of all) {
    let entry = dict.lookup(word);
    if (!entry) {
      for (const alt of variants(word).slice(1)) {
        entry = dict.lookup(alt);
        if (entry) { viaVariant++; break; }
      }
    }
    if (!entry) {
      missing.push(word);
      if (kpWords.has(word)) kpMiss.push(word);
      continue;
    }
    entries[word] = entry;
  }

  dict.close();

  const hit = all.length - missing.length;
  const kpHit = kpWords.size - kpMiss.length;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    source: 'ECDICT ecdict-sqlite-28',
    generatedFrom: path.relative(ROOT, DEFAULT_DB),
    wordCount: all.length,
    hitCount: hit,
    kpWordCount: kpWords.size,
    kpHitCount: kpHit,
    entries,
    missing,
  }, null, 0));

  console.log(`词典缓存写入 ${path.relative(ROOT, OUT)}`);
  console.log(`  正文词形        ${all.length}`);
  console.log(`  ECDICT 命中      ${hit}  (${(hit / all.length * 100).toFixed(1)}%)`);
  console.log(`    其中靠剥离所有格/连字符命中  ${viaVariant}`);
  console.log(`  知识点词条       ${kpWords.size}`);
  console.log(`    命中           ${kpHit}  (${(kpHit / kpWords.size * 100).toFixed(1)}%)`);
  console.log(`  未收录           ${missing.length}，其中知识点词条 ${kpMiss.length}`);
  if (kpMiss.length) console.log(`    知识点未收录示例  ${kpMiss.slice(0, 30).join(', ')}`);
  console.log(`  文件大小         ${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB`);
}

main();

