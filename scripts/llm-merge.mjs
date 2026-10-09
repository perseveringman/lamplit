// Step 5 合并：收拢 LLM 批次结果，做机械校验，产出可提交的覆盖层。
//
// 校验是这一步的核心价值。LLM 生成的句子分析没有候选集可约束，
// 所以改用三条能机械验证的硬约束，违反的条目整条丢弃而不是将错就错：
//   1. skeleton / modifiers[].text 必须是原句的精确子串（模型编不出来）
//   2. role 必须在封闭词表内（否则 UI 会长出三十种说法）
//   3. grammarRefs 必须是该句已有语法点的子集（不许自己发明语法点）
//
// 产出：.llm/overrides.json —— build-data 会读它
// 用法：npm run llm:merge
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, '.llm');
const OUT = path.join(DIR, 'overrides.json');

export const ROLES = ['定语从句', '状语从句', '宾语从句', '同位语', '分词短语', '介词短语', '不定式', '插入语', '并列结构', '其他'];
const MAX_GLOSS = 30;
const MAX_WHY = 72;

/** 句子原始文本与已有语法点，用于校验。 */
function sentenceIndex() {
  const index = new Map();
  for (const book of [1, 2, 3, 4]) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/books/${book}.json`), 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const s of lesson.sentences || []) index.set(s.id, s);
    }
  }
  return index;
}

function grammarNamesOf(catalog, sentence) {
  const kpById = new Map(catalog.kps.map((k) => [k.id, k]));
  return new Set(sentence.hits.map((h) => kpById.get(h[0])).filter((k) => k && k.type === 'grammar').map((k) => k.name));
}

export function validateAnalysis(item, sentence, grammarNames) {
  const errors = [];
  const text = sentence.text;
  if (!item || typeof item !== 'object') return { ok: false, errors: ['not an object'] };
  if (typeof item.skeleton !== 'string' || !item.skeleton.length) errors.push('missing skeleton');
  else if (!text.includes(item.skeleton)) errors.push(`skeleton not a substring: ${JSON.stringify(item.skeleton).slice(0, 40)}`);
  const mods = [];
  for (const m of Array.isArray(item.modifiers) ? item.modifiers : []) {
    if (!m || typeof m.text !== 'string' || !text.includes(m.text)) { errors.push(`modifier not a substring: ${JSON.stringify(m?.text).slice(0, 30)}`); continue; }
    if (!ROLES.includes(m.role)) { errors.push(`role not allowed: ${m.role}`); continue; }
    mods.push({ text: m.text, role: m.role });
  }
  const refs = (Array.isArray(item.grammarRefs) ? item.grammarRefs : []).filter((r) => grammarNames.has(r));
  if (typeof item.gloss !== 'string' || !item.gloss.trim()) errors.push('missing gloss');
  else if ([...item.gloss].length > MAX_GLOSS) errors.push(`gloss too long (${[...item.gloss].length})`);
  if (typeof item.whyLearn !== 'string' || !item.whyLearn.trim()) errors.push('missing whyLearn');
  else if ([...item.whyLearn].length > MAX_WHY) errors.push(`whyLearn too long (${[...item.whyLearn].length})`);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { skeleton: item.skeleton, modifiers: mods, grammarRefs: refs, gloss: item.gloss.trim(), whyLearn: item.whyLearn.trim() } };
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
  const sentences = sentenceIndex();
  const outDir = path.join(DIR, 'out');
  if (!fs.existsSync(outDir)) throw new Error('没有 .llm/out，先跑 npm run llm:prepare 和批次生成');

  const senses = {};
  const analyses = {};
  const stats = { files: 0, senseAccepted: 0, senseRejected: 0, analysisAccepted: 0, analysisRejected: 0, errors: [] };

  for (const file of fs.readdirSync(outDir).filter((f) => f.endsWith('.json')).sort()) {
    let payload;
    try { payload = JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf8')); }
    catch (e) { stats.errors.push(`${file}: ${e.message}`); continue; }
    stats.files++;

    // 词义批次：结构简单，只校验下标与释义非空
    if (payload.results && payload.results.some((r) => r.words)) {
      for (const r of payload.results) {
        const sentence = sentences.get(r.sentenceId);
        if (!sentence || !r.words) continue;
        for (const [kpId, pick] of Object.entries(r.words)) {
          const gloss = typeof pick === 'string' ? pick : pick?.gloss;
          if (typeof gloss !== 'string' || !gloss.trim() || [...gloss].length > MAX_GLOSS) { stats.senseRejected++; continue; }
          senses[`${r.sentenceId}|${kpId}`] = { gloss: gloss.trim(), src: 'llm' };
          stats.senseAccepted++;
        }
      }
      continue;
    }

    // 句子分析批次：跑三条硬约束
    for (const r of payload.results || []) {
      const sentence = sentences.get(r.sentenceId);
      if (!sentence) { stats.analysisRejected++; continue; }
      const grammarNames = grammarNamesOf(catalog, sentence);
      const v = validateAnalysis(r, sentence, grammarNames);
      if (!v.ok) { stats.analysisRejected++; stats.errors.push(`${r.sentenceId}: ${v.errors.join('; ')}`); continue; }
      analyses[r.sentenceId] = v.value;
      stats.analysisAccepted++;
    }
  }

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), senses, analyses }, null, 0));
  console.log('LLM 覆盖层写入', path.relative(ROOT, OUT));
  console.log(`  读到批次结果文件   ${stats.files}`);
  console.log(`  词义  接受 ${stats.senseAccepted} / 拒绝 ${stats.senseRejected}`);
  console.log(`  分析  接受 ${stats.analysisAccepted} / 拒绝 ${stats.analysisRejected}`);
  if (stats.errors.length) {
    console.log('  被丢弃的原因（前 15 条）:');
    for (const e of stats.errors.slice(0, 15)) console.log('    ' + e);
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main();
