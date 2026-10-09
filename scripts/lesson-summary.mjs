/**
 * 课文导读（C5）。
 *
 * 原先 288 课里只有 5 课有真正的 summary，283 课共用**聚类的默认 canDo**——
 * 也就是说同一聚类的所有课文显示同一句话。
 *
 * 这里用**模板化生成**，输入是已经可信的两样东西：
 *   - genre（体裁，来自聚类）与 wc / sentenceCount（课文自身的长度）
 *   - focus（D1 三层重算的结果：教材事实 + 册内 IDF + 课级引入过滤）
 *
 * 三条自律：
 *   1. **写描述，不写承诺**。"顺着时间线读"是读法；"你能读懂记叙文"是承诺，兑现不了。
 *   2. **课程之间必须不同**。如果两课生成出同一句，说明输入没起作用，会失败在断言上。
 *   3. **不抄任何外部材料**（原则 11）。体裁读法是自己写的常识，不取自教辅。
 */

const GENRE = {
  '叙事': { label: '记叙文', hint: '顺着时间线读，注意动作的先后与转折。' },
  '对话': { label: '对话', hint: '注意话轮之间怎么接：谁在问、谁在答、谁在转话题。' },
  '说明': { label: '说明文', hint: '先找说明对象，再看各个特征是怎么展开的。' },
  '议论 / 说明': { label: '议论文', hint: '先找论点，再看论据是怎么支撑它的。' },
};

export function summaryOf(lesson, focusNames) {
  const g = GENRE[lesson.genre] || { label: '课文', hint: '' };
  const head = `${g.label}，${lesson.wc} 词 ${lesson.sentenceCount} 句`;
  const focus = focusNames.length ? `精读重点：${focusNames.join('、')}。` : '';
  return `${head}。${g.hint}${focus}`;
}

export function canDoOf(lesson, focusNames) {
  if (!focusNames.length) return null;
  const list = focusNames.join('、');
  // 用"辨认/看清"这类可检验的动作，不用"掌握/能运用"这类无法在界面上兑现的说法
  switch (lesson.genre) {
    case '对话': return `在对话里辨认 ${list} 的用法，注意它们出现在谁的话里。`;
    case '说明': return `跟着说明顺序，看清 ${list} 在句中承担的作用。`;
    case '议论 / 说明': return `在论证里辨认 ${list}，看它们怎么服务于论点。`;
    default: return `顺着叙述辨认 ${list}，看它们在时间里怎么排布。`;
  }
}
