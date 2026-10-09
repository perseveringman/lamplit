// Step 6：金标集回归测试。
//
// 这是整套释义管线唯一能防止退化的东西。重跑词典、换词典、重跑 LLM 之后，
// 这些手工判定过的条目必须仍然判对。
//
// 匹配用「必须包含」而不是精确相等——避免把措辞差异当成错误。
// notExpect 用来抓「错得离谱」而不是「不够精确」，这类错误对学习者伤害最大。
//
// 标了 knownGap 的条目会被记录但不阻塞构建：它们是已知的、有明确修复路径的缺口。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public/data');

function load() {
  const sentences = new Map();
  for (const book of [1, 2, 3, 4]) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA, `books/${book}.json`), 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const s of lesson.sentences || []) sentences.set(s.id, { sentence: s, lesson });
    }
  }
  return { sentences };
}

/** 取出某次命中在当前产物里的展示释义。 */
function glossOf(lesson, sentence, kpId) {
  const hit = (sentence.hits || []).find((h) => h[0] === kpId && h.length > 3);
  if (!hit || hit[3] === undefined) return { gloss: null, method: null };
  return {
    gloss: lesson.glosses?.[hit[3]] ?? null,
    method: hit[4] !== undefined ? lesson.glossMethods?.[hit[4]] ?? null : null,
  };
}

test('golden set: contextual senses', () => {
  const { sentences } = load();
  const golden = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/golden-senses.json'), 'utf8'));
  const failures = [];
  const gaps = [];
  let checked = 0;

  for (const c of golden.cases) {
    const report = (msg) => (c.knownGap ? gaps : failures).push(`${c.id}: ${msg}`);
    const entry = sentences.get(c.sentenceId);
    if (!entry) { report(`句子 ${c.sentenceId} 不在产物里`); continue; }
    const { lesson, sentence } = entry;
    if (c.text && sentence.text !== c.text) {
      report(`句子文本与金标集不一致｜产物 ${JSON.stringify(sentence.text)}｜金标 ${JSON.stringify(c.text)}`);
      continue;
    }
    const { gloss, method } = glossOf(lesson, sentence, c.kpId);
    if (gloss === null) { report(`${c.kpId} 没有语境释义（词典层可能未构建）`); continue; }
    checked++;
    // expect 是「可接受的答案集合」：命中任意一个即可，不是全都要出现
    if (c.expect?.length && !c.expect.some((w) => gloss.includes(w))) {
      report(`期望其中之一「${c.expect.join(' / ')}」，实际是「${gloss}」 [${method}]`);
    }
    for (const bad of c.notExpect || []) {
      if (gloss.includes(bad)) report(`不该出现「${bad}」，实际是「${gloss}」 [${method}]`);
    }
  }

  if (gaps.length) {
    console.log(`已知缺口 ${gaps.length} 条（已记录，不阻塞构建）:`);
    for (const g of gaps) console.log(`  · ${g}`);
  }
  if (failures.length) {
    assert.fail(`金标集 ${failures.length} 条不通过（共 ${golden.cases.length} 条，已检查 ${checked} 条）:\n  - ${failures.join('\n  - ')}`);
  }
  assert.ok(checked >= golden.cases.length * 0.8, `金标集覆盖率过低：只检查了 ${checked}/${golden.cases.length}`);
});

test('gloss layer covers the corpus without inventing text', () => {
  const { sentences } = load();
  let total = 0, covered = 0;
  for (const { lesson, sentence } of sentences.values()) {
    for (const h of sentence.hits || []) {
      if (!h[0].startsWith('w-')) continue;
      total++;
      if (h.length > 3 && lesson.glosses?.[h[3]]) covered++;
    }
  }
  assert.ok(total > 30000, `单词命中数量异常：${total}`);
  const rate = covered / total;
  assert.ok(rate > 0.95, `语境释义覆盖率 ${(rate * 100).toFixed(1)}% 低于 95%（${covered}/${total}）`);
});

test('every gloss entry is a non-empty short string', () => {
  for (const book of [1, 2, 3, 4]) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA, `books/${book}.json`), 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const g of lesson.glosses || []) {
        assert.equal(typeof g, 'string', `${lesson.id} 的 gloss 不是字符串`);
        assert.ok(g.trim().length > 0, `${lesson.id} 有空释义`);
        assert.ok([...g].length <= 40, `${lesson.id} 的释义过长：${g}`);
      }
    }
  }
});

test('sentence analyses satisfy their structural contract', () => {
  const ROLES = new Set(['定语从句', '状语从句', '宾语从句', '同位语', '分词短语', '介词短语', '不定式', '插入语', '并列结构', '其他']);
  let withAnalysis = 0;
  for (const book of [1, 2, 3, 4]) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA, `books/${book}/json`.replace('/json', '.json')), 'utf8'));
    for (const lesson of Object.values(data)) {
      for (const s of lesson.sentences || []) {
        if (!s.analysis) continue;
        withAnalysis++;
        const a = s.analysis;
        assert.ok(s.text.includes(a.skeleton), `${s.id} 的主干不是原句子串：${a.skeleton}`);
        for (const m of a.modifiers) {
          assert.ok(s.text.includes(m.text), `${s.id} 的修饰片段不是原句子串：${m.text}`);
          assert.ok(ROLES.has(m.role), `${s.id} 的角色不在封闭词表内：${m.role}`);
        }
        assert.ok(a.gloss.trim().length > 0, `${s.id} 缺少 gloss`);
        assert.ok(a.whyLearn.trim().length > 0, `${s.id} 缺少 whyLearn`);
      }
    }
  }
  // 分析集合是「成本受限的选择」，不再由分档决定，所以这里不按比例断言。
  // 但必须防住「分析静默流失」——批次 ID 冲突曾让分析从 815 掉到 781，那次没有任何测试报警。
  assert.ok(withAnalysis >= 1200, `分句分析数不应低于 1200，当前 ${withAnalysis}（疑似产物流失）`);
});
