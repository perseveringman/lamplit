// 把 ECDICT 派生出的动词变形表固化成可提交的文件。
//
// 为什么必须固化：.dict-cache 不进版本库，新克隆的仓库没有 ECDICT。
// 而 knowledge.mjs 的语块匹配依赖变形表——原来那张表是手工维护的 30 个动词，
// 漏掉 wake/hang/ring/sell/cut/hide/lay/rise…，导致 `wake up` 定义过却匹配不到
// `woke up`（7 次），`depend on` 匹配不到 `depends on`（7 次）。
//
// 这张表由 ECDICT 的 exchange 字段生成，不再手工维护。
// 用法：npm run chunks:forms
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.dict-cache/corpus-dict.json');
const OUT = path.join(ROOT, 'scripts/verb-forms.mjs');

/** 语块清单里所有以动词开头的首词。 */
export function headsFromChunks(list) {
  const heads = new Set();
  for (const { name } of list) heads.add(name.split(' ')[0]);
  return [...heads];
}

function main() {
  const { CHUNK_CANDIDATES } = { CHUNK_CANDIDATES: null };
  void CHUNK_CANDIDATES;
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const entries = cache.entries;

  const knowledge = fs.readFileSync(path.join(ROOT, 'scripts/knowledge.mjs'), 'utf8');
  const block = knowledge.match(/const chunkText = `([\s\S]*?)`;/);
  if (!block) throw new Error('没找到 knowledge.mjs 里的 chunkText');

  const names = block[1].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).map((l) => l.split('|')[0].trim().toLowerCase());
  const heads = [...new Set(names.map((n) => n.split(' ')[0]))];

  // ECDICT 的 exchange 对个别高频动词不完整：be 少了 am/are/were。
  // 少了这几个，"am very proud of" 这类 be+形容词+介词 全部匹配不到。
  // 这里是并集补充，不会移除 ECDICT 给出的任何形式。
  const SUPPLEMENT = {
    be: ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'being'],
    get: ['get', 'gets', 'getting', 'got', 'gotten'],
    have: ['have', 'has', 'had', 'having'],
    do: ['do', 'does', 'did', 'done', 'doing'],
  };

  // 有些动词原形本身不在语料里（只有 taught / tore / shone），词条查不到。
  // 用「变形 → 原形」的反向索引把它们补回来。
  const lemmaIndex = new Map();
  for (const [word, entry] of Object.entries(entries)) {
    if (entry.lemma && entry.lemma !== word) {
      if (!lemmaIndex.has(entry.lemma)) lemmaIndex.set(entry.lemma, new Set());
      lemmaIndex.get(entry.lemma).add(word);
    }
  }

  const table = {};
  const missing = [];
  for (const head of heads) {
    const entry = entries[head];
    const extra = [...(SUPPLEMENT[head] || []), ...(lemmaIndex.get(head) || [])];
    if (!entry && !extra.length) { missing.push(head); continue; }
    // 过滤 ECDICT 的数据噪音：有些短语条目的 lemma 被误标成动词，
    // 于是 "of--the" 会作为 have 的变形混进来。
    const plausible = (f) => typeof f === 'string'
      && f.length <= 14
      && !f.includes('--')
      && /^[a-z][a-z']*(?:-[a-z']+)*$/.test(f);
    const forms = [...new Set([head, ...(entry?.forms || []), ...extra])]
      .filter(plausible)
      .sort((a, b) => b.length - a.length);
    if (forms.length > 1) table[head] = forms;
  }

  const body = Object.keys(table).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(table[k].join('|'))},`).join('\n');
  const text = `// 由 ECDICT 的 exchange 字段自动生成，请勿手工编辑。
// 重新生成：npm run chunks:forms
//
// 覆盖 ${Object.keys(table).length} 个动词；原来手工维护的表只有 30 个。
// 形态说明（如 "wake的过去式和过去分词"）不参与匹配，只用于展示。

export const VERB_FORMS = {
${body}
};

/** 展成正则用的分支串；未收录的动词按原形返回。 */
export function formsOf(head) {
  return VERB_FORMS[head] || head;
}
`;
  fs.writeFileSync(OUT, text);
  console.log(`变形表写入 ${path.relative(ROOT, OUT)}`);
  console.log(`  动词条目 ${Object.keys(table).length}`);
  console.log(`  跳过（无变形或非动词）${missing.length}`);
  if (missing.length) console.log(`  ${missing.slice(0, 40).join(', ')}`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main();
