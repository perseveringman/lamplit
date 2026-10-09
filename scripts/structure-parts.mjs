/**
 * 语法命中的「本句体现」——结构成分拆解（hit 载荷按类型分派）。
 *
 * 为什么只有 grammar 需要：word 需要的是「取哪个义项」，chunk / pattern 的意义
 * 挂在知识点上（每处相同），**只有语法的本句体现逐句不同**。
 *
 * 设计要点（见 docs/pipeline/HIT-PAYLOAD.md）：
 *   - 纯增量：不改 Hit 元组，另挂 structureParts
 *   - 只用发货的 PP / ADV 构件（原则 14）
 *   - **切不出就留空，不猜**。空载荷比例会被报告出来
 */

import { PP, ADV } from './knowledge.mjs';

const NOT = "(?:(?:not|'t)\\s+)?";
// been / being 必须排在 be 之前：正则交替是有序的，'be' 会先把 'been' 吃掉
const AUX_BE = '(?:am|is|are|was|were|been|being|be)';
const AUX_PC = "(?:am|is|are|'m|'s|'re)";
const AUX_PP = "(?:have|has|'ve)";
const AUX_WILL = "(?:will|shall|'ll)";
const MODAL = "(?:can|could|may|might|must|should|would|will|shall|can't|couldn't|won't|wouldn't|shouldn't|mustn't)";

/**
 * 规则 id → 成分序列。每项是 [正则片段, 角色]。
 * **只收录公式化的规则**——结构固定、成分可枚举。语义型的（如定语从句）不收。
 */
export const STRUCTURE_PARTS = {
  'g-present-continuous': [[AUX_PC, '助动词'], [NOT + ADV, '副词'], ['[a-z]+ing', '现在分词']],
  'g-past-continuous': [['(?:was|were)', '助动词'], [NOT + ADV, '副词'], ['[a-z]+ing', '现在分词']],
  'g-present-perfect': [[AUX_PP, '助动词'], [NOT + ADV, '副词'], [PP, '过去分词']],
  'g-past-perfect': [['had', '助动词'], [NOT + ADV, '副词'], [PP, '过去分词']],
  'g-passive': [[AUX_BE, '助动词'], [NOT + ADV, '副词'], [PP, '过去分词']],
  'g-future': [[AUX_WILL, '助动词'], [NOT, '否定'], ['[a-z]+', '动词原形']],
  'g-modal': [[MODAL, '情态动词'], [NOT, '否定'], ['[a-z]+', '动词原形']],
  'g-going-to': [["(?:am|is|are|'m|'s|'re)", '助动词'], ['going', 'going'], ['to', 'to'], ['[a-z]+', '动词原形']],
};

/**
 * 把一个命中 span 切成成分。**切不出就返回 null**——不产出半截或猜测的结果。
 * @returns {{text:string, role:string}[] | null}
 */
export function splitSpan(span, parts) {
  const text = String(span || '').trim();
  if (!text) return null;
  const out = [];
  let rest = text;
  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    let mm;
    try {
      mm = rest.match(new RegExp('^(?:' + parts[i][0] + ')' + (isLast ? '$' : '') + '\\s*', 'i'));
    } catch { return null; }
    // 可选成分（如副词槽）合法地匹配空串，不能因此判失败
    if (!mm) return null;
    const piece = mm[0].trim();
    if (piece) out.push({ text: piece, role: parts[i][1] });
    rest = rest.slice(mm[0].length);
    if (!rest && !isLast) return null;
  }
  if (rest.trim()) return null;
  return out.length ? out : null;
}

/** 切分一条规则的命中，返回成分表或 null。 */
export function partsOf(kpId, span) {
  const spec = STRUCTURE_PARTS[kpId];
  if (!spec) return null;
  return splitSpan(span, spec);
}
