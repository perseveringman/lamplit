/**
 * 测验题库（D2）。
 *
 * 两条生成原则：
 *   1. **只从课文语料生成**，不从外部材料搬题（原则 11）。
 *   2. **只用该课 teachingFocus 覆盖的知识点出题**。没有这条，题库会考"文本里恰好出现的结构"，
 *      而不是"这一课教的东西"——288 课全部返工。
 *
 * 五条机械校验（`validateItem`），任一不过整题丢弃：
 *   ① 答案必须是原句的精确子串
 *   ② 挖空位置必须对应真实的 KP 命中
 *   ③ 题干不得出现课文里没有的词
 *   ④ 干扰项必须来自同类型 KP
 *   ⑤ 题目必须命中该课 teachingFocus
 * 外加产出约束：知识点引入册 <= 本课所在册。
 */

/** 从同类型知识点里取干扰项。优先取同册出现过的，其次任意同类。 */
function distractorsOf(kp, pool, n, book) {
  const same = pool.filter((k) => k.id !== kp.id && k.type === kp.type);
  const preferred = same.filter((k) => k.introduceBook == null || k.introduceBook <= book);
  const pick = (arr) => arr.slice().sort((a, b) => a.id.localeCompare(b.id));
  return pick(preferred.length >= n ? preferred : same).slice(0, n);
}

/** 把原句里的一处 KP 命中挖成空。答案就是被挖掉的那段原文。 */
function blank(text, start, end) {
  return { stem: text.slice(0, start) + '______' + text.slice(end), answer: text.slice(start, end) };
}

export function buildQuiz(lesson, focusIds, kpById, pool, book) {
  const focus = new Set(focusIds);
  const items = [];
  // 第一种：结构辨认。用于 focus 里的语法/句型 —— 它们没法"挖空填释义"。
  // 题干是该课的一句原句，正确项是该结构的名称，干扰项取自同类型的其它结构。
  for (const id of focusIds) {
    const kp = kpById.get(id);
    if (!kp || (kp.type !== 'grammar' && kp.type !== 'pattern')) continue;
    if (kp.introduceBook != null && kp.introduceBook > book) continue;
    const s = (lesson.sentences || []).find((x) => x.hits.some((h) => h[0] === id) && x.wc >= 6 && x.text.length <= 160);
    if (!s) continue;
    const wrong = pool.filter((k) => k.id !== id && k.type === kp.type && (k.introduceBook == null || k.introduceBook <= book)).map((k) => k.name).filter((n) => n !== kp.name);
    if (wrong.length < 3) continue;
    const opts = [kp.name, ...wrong.sort((a, b) => a.localeCompare(b)).slice(0, 3)].sort((a, b) => a.localeCompare(b));
    items.push({ id: `q-${lesson.id}-${id}-struct`, lessonId: lesson.id, sentenceId: s.id, kpId: id, kind: 'structure', stem: s.text, answer: kp.name, options: opts, answerIndex: opts.indexOf(kp.name) });
  }
  for (const s of lesson.sentences || []) {
    for (const h of s.hits) {
      const kp = kpById.get(h[0]);
      if (!kp) continue;
      if (kp.type !== 'word' && kp.type !== 'chunk') continue;
      // ⑤ 必须命中该课 teachingFocus
      if (!focus.has(kp.id)) continue;
      // 引入册约束
      if (kp.introduceBook != null && kp.introduceBook > book) continue;
      const [start, end] = [h[1], h[2]];
      if (!(end > start) || end - start > 40) continue;
      const { stem, answer } = blank(s.text, start, end);
      // ① 答案必须是原句精确子串（由构造保证，这里再验一次）
      if (!s.text.includes(answer) || s.text.slice(start, end) !== answer) continue;
      // ③ 题干不得引入课文里没有的词（由构造保证：stem 是原句的子串重组）
      if (stem.replace('______', '') !== s.text.slice(0, start) + s.text.slice(end)) continue;
      const meaning = kp.coreSense || kp.meaning;
      if (!meaning) continue;
      const wrong = distractorsOf(kp, pool, 3, book).map((k) => k.coreSense || k.meaning).filter((m) => m && m !== meaning);
      if (wrong.length < 3) continue;
      // 问法是「空里那个表达是什么意思」——所以答案是**释义**，被挖掉的原文另存 blanked。
      // 两者混用会让 answerIndex 指向错的选项（这个 bug 被 check-data 抓到过）。
      const opts = [meaning, ...wrong].sort((a, b) => a.localeCompare(b));
      items.push({
        id: `q-${lesson.id}-${s.id}-${start}`,
        lessonId: lesson.id,
        sentenceId: s.id,
        kpId: kp.id,
        kind: 'blank',
        stem,
        blanked: answer,
        answer: meaning,
        options: opts,
        answerIndex: opts.indexOf(meaning),
        sourceStart: start,
        sourceEnd: end,
      });
      if (items.length >= 5) return items;
    }
  }
  return items;
}

/** 五条机械校验。返回 null 表示通过，否则返回失败原因。 */
export function validateItem(item, lesson, kpById, pool, focusIds) {
  const s = (lesson.sentences || []).find((x) => x.id === item.sentenceId);
  if (!s) return '句子不存在';
  if (item.kind === 'structure') {
    // 结构辨认题：答案不是原文片段，① 改为「答案必须是该结构的名称」
    const kp0 = kpById.get(item.kpId);
    if (!kp0 || item.answer !== kp0.name) return '① 答案不是该结构的名称';
    if (!s.hits.some((h) => h[0] === item.kpId)) return '② 该句没有这个结构的真实命中';
    if (new Set(item.options).size < 4) return '④ 干扰项重复';
    if (!focusIds.includes(item.kpId)) return '⑤ 未命中该课 teachingFocus';
    if (kp0.introduceBook != null && kp0.introduceBook > lesson.book) return '引入册晚于本课所在册';
    return null;
  }
  if (!s.text.includes(item.blanked)) return '① 被挖掉的原文不是原句精确子串';
  if (s.text.slice(item.sourceStart, item.sourceEnd) !== item.blanked) return '① 挖空位置与原文不符';
  const hit = s.hits.find((h) => h[0] === item.kpId && h[1] === item.sourceStart && h[2] === item.sourceEnd);
  if (!hit) return '② 挖空位置不对应真实 KP 命中';
  // ③ 题干去掉空位后必须是原句去掉答案后的部分
  if (item.stem.replace('______', '') !== s.text.slice(0, item.sourceStart) + s.text.slice(item.sourceEnd)) return '③ 题干引入了课文外的文字';
  const kp = kpById.get(item.kpId);
  if (!kp) return '② 知识点不存在';
  const wrong = item.options.filter((o) => o !== (kp.coreSense || kp.meaning));
  if (wrong.length < 3) return '④ 干扰项不足';
  if (item.options[item.answerIndex] !== (kp.coreSense || kp.meaning)) return '① 答案下标与释义不符';
  if (!focusIds.includes(item.kpId)) return '⑤ 未命中该课 teachingFocus';
  if (kp.introduceBook != null && kp.introduceBook > lesson.book) return '引入册晚于本课所在册';
  return null;
}
