// Step 3：把「还差多少释义」量化成可决策的数字。
//
// 报告三件事：
//   1. 语境释义的覆盖率与解析方法分布（机械规则能定多少）
//   2. 剩余工作按 A/B/C/D 频次分层——决定 LLM 预算该花在哪里
//   3. 与旧实现的逐条对比（旧释义 vs 新语境义），用于人工抽查
//
// 用法：npm run report:senses
import fs from 'node:fs';
import path from 'node:path';
import { resolveSense } from './senses.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.dict-cache/corpus-dict.json');

/** 频次分层：越靠前越该投入精校成本。 */
export function tierOf(frequency) {
  if (frequency >= 20) return 'A';
  if (frequency >= 5) return 'B';
  if (frequency >= 2) return 'C';
  return 'D';
}
export const TIER_LABEL = {
  A: 'A 高频 (≥20 次)',
  B: 'B 中频 (5–19 次)',
  C: 'C 低频 (2–4 次)',
  D: 'D 仅 1 次',
};

/** LLM 批量标注的覆盖层（Step 5）。缺失时报告退回纯机械基线。 */
export function loadOverrides() {
  const file = path.join(ROOT, '.llm/overrides.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadDictCache() {
  if (!fs.existsSync(CACHE)) {
    throw new Error(`缺少词典缓存 ${path.relative(ROOT, CACHE)}，请先运行 npm run dict:cache`);
  }
  return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
}

/** 遍历语料中的每一次单词出现，附带语块覆盖信息。 */
export function* occurrences({ catalog, books, onLesson }) {
  const kpById = new Map(catalog.kps.map((k) => [k.id, k]));
  for (const book of books) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/books/${book}.json`), 'utf8'));
    for (const lesson of Object.values(data)) {
      if (!lesson?.sentences) continue;
      onLesson?.(lesson);
      for (const s of lesson.sentences) {
        const chunkHits = s.hits.filter((h) => kpById.get(h[0])?.type === 'chunk');
        for (const h of s.hits) {
          const kp = kpById.get(h[0]);
          if (!kp || kp.type !== 'word') continue;
          const [id, start, end] = h;
          const cover = chunkHits.find((c) => c[1] <= start && c[2] >= end && (c[1] < start || c[2] > end));
          yield { lesson, sentence: s, kp, start, end, coveringChunk: cover ? kpById.get(cover[0]) : null };
        }
      }
    }
  }
}

function main() {
  const cache = loadDictCache();
  const entries = cache.entries;
  const lookup = (w) => entries[String(w || '').toLowerCase()] || null;
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
  const overrides = loadOverrides();

  const methods = {};
  const tierTally = {};
  let total = 0, resolved = 0, unresolved = 0;
  const unresolvedWords = new Map();
  const changed = [];
  const samples = [];

  for (const o of occurrences({ catalog, books: [1, 2, 3, 4] })) {
    total++;
    const tier = tierOf(o.kp.frequency);
    tierTally[tier] = tierTally[tier] || { occurrences: 0, resolved: 0 };
    tierTally[tier].occurrences++;

    // 语块优先于 LLM；LLM 优先于词典与编辑词表——与 build-data 的优先级一致
    const llm = overrides?.senses?.[`${o.sentence.id}|${o.kp.id}`];
    const r = llm && !o.coveringChunk
      ? { zh: llm.gloss, method: 'llm', en: '', pos: null }
      : resolveSense({
        text: o.sentence.text,
        start: o.start,
        end: o.end,
        entry: lookup(o.kp.name),
        coveringChunk: o.coveringChunk,
        editorial: o.kp.meaning || null,
        lookup,
      });

    if (!r || !r.zh) {
      unresolved++;
      unresolvedWords.set(o.kp.name, (unresolvedWords.get(o.kp.name) || 0) + 1);
      continue;
    }
    resolved++;
    tierTally[tier].resolved++;
    const key = r.method.replace(/\+lemma$/, '');
    methods[key] = (methods[key] || 0) + 1;

    const oldMeaning = o.kp.meaning || '';
    if (oldMeaning && r.zh && !oldMeaning.includes(r.zh.split('；')[0])) {
      changed.push({ name: o.kp.name, old: oldMeaning, now: r.zh, method: r.method, lesson: o.lesson.label });
    }
    if (samples.length < 60) {
      samples.push({ surface: o.sentence.text.slice(o.start, o.end), got: r.zh, method: r.method, text: o.sentence.text, lesson: o.lesson.label });
    }
  }

  const pct = (n) => `${(100 * n / total).toFixed(1)}%`;
  console.log(`单词出现总数 ${total}`);
  console.log(`解析出语境义 ${resolved}  (${pct(resolved)})`);
  console.log(`仍无释义     ${unresolved}  (${pct(unresolved)})`);
  console.log();

  console.log(`LLM 覆盖层：${overrides ? `${Object.keys(overrides.senses || {}).length} 条语境义、${Object.keys(overrides.analyses || {}).length} 条句子分析` : '未加载（只有机械基线）'}`);
  console.log();
  console.log('=== 解析方法分布（机械规则能定多少）===');
  for (const [k, v] of Object.entries(methods).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(6)}  ${pct(v)}`);
  }
  console.log();

  console.log('=== 按频次分层：LLM 预算该花在哪 ===');
  console.log('  档位              出现次数   机械已解析   占比');
  for (const t of ['A', 'B', 'C', 'D']) {
    const row = tierTally[t];
    if (!row) continue;
    const share = (100 * row.occurrences / total).toFixed(1);
    console.log(`  ${TIER_LABEL[t].padEnd(18)} ${String(row.occurrences).padStart(6)}   ${String(row.resolved).padStart(8)}   ${share}% of total`);
  }
  console.log();

  console.log('=== 仍无释义的词 top 20 ===');
  console.log('  ' + [...unresolvedWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => `${k}(${v})`).join(', '));
  console.log();

  console.log('=== 旧释义 → 新语境义（抽查 30 条差异）===');
  for (const c of changed.slice(0, 30)) {
    console.log(`  ${c.name.padEnd(12)} 旧:"${c.old.slice(0, 26)}"  →  新:"${c.now}"  [${c.method}]`);
  }
  console.log(`  （共 ${changed.length} 条与旧释义不同）`);
  console.log();

  console.log('=== 随机样本 ===');
  for (const s of samples.slice(0, 30)) {
    console.log(`  ${s.surface.padEnd(14)} → ${s.got.slice(0, 20).padEnd(22)} [${s.method}]  ${s.text.slice(0, 50)}`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main();
