// Step 5 准备：把待处理的句子切成批次文件，供 LLM 批量标注。
//
// 为什么走文件而不是把内容塞进 workflow 的 args：
//   272 个批次的内容有好几百 KB，塞进脚本参数不现实。
//   agent 有文件系统访问权，所以让它读一个批次文件、写一个结果文件。
//
// 产出：.llm/in/<id>.json（批次）、.llm/manifest.json（清单）
// 用法：npm run llm:prepare
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, '.llm');
const BATCH_SIZE = Number(process.env.LLM_BATCH || 16);
const MAX_PER_WORD = 10;

/** A 档打包义项词：词典把一个词性下的一串义项打包成一行，机械层切不开。 */
function bundledWords(catalog) {
  const map = new Map();
  for (const kp of catalog.kps) {
    if (kp.type !== 'word') continue;
    if (kp.frequency < 20) continue;
    if (!kp.coreSense || !kp.coreSense.includes('；')) continue;
    map.set(kp.name, kp);
  }
  return map;
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
  const bundled = bundledWords(catalog);
  const kpById = new Map(catalog.kps.map((k) => [k.id, k]));

  const already = new Set(Object.keys(JSON.parse(fs.existsSync('.llm/overrides.json') ? fs.readFileSync('.llm/overrides.json','utf8') : '{}').analyses || {}));
 const senseItems = [];
  const analysisItems = [];

  for (const book of [1, 2, 3, 4]) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/books/${book}.json`), 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const s of lesson.sentences || []) {
        const words = [];
        const seen = new Set();
        for (const h of s.hits) {
          const kp = kpById.get(h[0]);
          if (!kp || kp.type !== 'word' || !bundled.has(kp.name) || seen.has(kp.name)) continue;
          seen.add(kp.name);
          const entry = bundled.get(kp.name);
          const candidates = [...new Set(String(entry.coreSense).replace(/…$/, '').split('；').map((x) => x.trim()).filter(Boolean))].slice(0, MAX_PER_WORD);
          if (candidates.length < 2) continue;
          words.push({
            kpId: kp.id,
            name: kp.name,
            surface: s.text.slice(h[1], h[2]),
            pos: entry.corePos || '',
            candidates,
            en: entry.enDefinition || '',
          });
        }
        if (words.length) senseItems.push({ sentenceId: s.id, lessonId: s.lessonId, text: s.text, words });

        // 分档已在早前移除，这里改用「册 2-4 + 最小词数」的口径选取例句池。
        // 册 1 跳过：例句多为极短句（此前实测仅 28% 有实质内容）。
        const inScope = s.book !== 1 && s.wc >= 6;
        if (inScope && !already.has(s.id)) {
          analysisItems.push({
            sentenceId: s.id,
            lessonId: s.lessonId,
            wc: s.wc,
            text: s.text,
            grammar: [...new Set(s.hits.map((h) => kpById.get(h[0])).filter((k) => k && k.type === 'grammar').map((k) => k.name))],
            chunks: [...new Set(s.hits.map((h) => kpById.get(h[0])).filter((k) => k && k.type === 'chunk').map((k) => k.name))],
          });
        }
      }
    }
  }

  fs.rmSync(path.join(DIR,'in'), { recursive: true, force: true });
  fs.mkdirSync(path.join(DIR,'in'), { recursive: true });
  fs.mkdirSync(path.join(DIR, 'in'), { recursive: true });
  fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });

  const manifest = { batchSize: BATCH_SIZE, sense: [], analysis: [] };
  let n = 0;
  for (const [kind, items] of [['sense', senseItems], ['analysis', analysisItems]]) {
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      // 按内容哈希命名，避免重跑时覆盖上一轮的批次结果
      const sig = createHash('sha256').update(chunk.map((x) => x.sentenceId).join(',')).digest('hex').slice(0, 8);
      const id = `${kind}-${sig}`;
      const batch = { id, kind, items: chunk };
      fs.writeFileSync(path.join(DIR, 'in', `${id}.json`), JSON.stringify(batch));
      manifest[kind].push({ id, count: batch.items.length });
      n++;
    }
  }
  fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 1));

  console.log(`批次目录 ${path.relative(ROOT, DIR)}`);
  console.log(`  词义批      ${manifest.sense.length} 个批次 / ${senseItems.length} 句 / ${senseItems.reduce((a, x) => a + x.words.length, 0)} 个待定词`);
  console.log(`  句子分析批  ${manifest.analysis.length} 个批次 / ${analysisItems.length} 句`);
  console.log(`  合计        ${n} 个批次文件（每批 ${BATCH_SIZE} 句）`);
}

main();
