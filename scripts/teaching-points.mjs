/**
 * 教学点（teachingPoint）——「要教什么」这一层，与「检测到什么」（语言对象）解耦。
 *
 * 这是「地基复审」的第一处修正：原先把教学点塞进规则里，会丢掉 62%。
 * 第四册 211 个教材教学点里只有 80 条能映射到规则；其余是修辞、省略、
 * 信息结构、语义用法——本架构没有表达它们的地方，但"没有落点"本身要可见。
 *
 * 遵循 PRINCIPLES 原则 11：
 *   - 事实（哪一课教哪个点）来自外部材料，采信
 *   - 表述（标题、说明）由本项目自撰：标题一律用**我方规则名**，不抄事实表的标签
 */

/** 由事实表的标签或规则类型推断教学点的类别。 */
export function kindOf(label, kpType) {
  if (/复习/.test(label)) return 'review';
  if (/时|态|语态|完成|进行|将来|过去/.test(label)) return 'tense';
  if (/从句|状语|同位语|宾语|主语|定语/.test(label)) return 'clause';
  if (/倒装|强调|语序|省略|成分|补全|分句/.test(label)) return 'syntax';
  if (/虚拟|情态|推测/.test(label)) return 'mood';
  if (/借词|介词|搭配|短语/.test(label)) return 'collocation';
  if (/构词|词缀|后缀|前缀|名词化/.test(label)) return 'morphology';
  if (/主谓一致/.test(label)) return 'agreement';
  if (/比较|最高级|倍数|数词|量词/.test(label)) return 'degree';
  if (/头韵|尾韵|暗喻|明喻|对比|修辞|写作|拟人|简洁|赘词/.test(label)) return 'writing';
  if (kpType === 'pattern') return 'pattern';
  return 'syntax';
}

/**
 * 从已核对的事实表生成教学点。
 * @param facts corpora/nce/teaching-facts.json 的内容
 * @param kpById 规则表（用于取我方自撰的规则名作为标题）
 * @param lessonById 课文表（用于判断 refs 在该课是否真有落点）
 */
export function deriveTeachingPoints(facts, kpById, lessonById) {
  const out = [];
  for (const p of facts.points || []) {
    const kp = kpById.get(p.kpId) || null;
    const lesson = lessonById.get(p.corpusLesson) || null;
    // refs 必须指向真实存在、且在该课真有命中的规则；否则为空数组——"教材教它，但本架构接不住"
    const hits = lesson
      ? (lesson.sentences || []).reduce((a, s) => a + s.hits.filter((h) => h[0] === p.kpId).length, 0)
      : 0;
    const refs = kp && hits > 0 ? [p.kpId] : [];
    out.push({
      id: `tp-${p.book}-${String(p.officialLesson).padStart(3, '0')}-${p.kpId}`,
      lessonId: p.corpusLesson,
      book: p.book,
      officialLesson: p.officialLesson,
      // 标题自撰：用我方规则名，不用事实表的标签
      title: kp ? kp.name : p.label,
      kind: kindOf(p.label, kp ? kp.type : null),
      refs,
      hits,
      covered: refs.length > 0,
      confidence: p.confidence,
      sources: p.sources || [],
      provenance: 'derived',
    });
  }
  return out;
}

/** 覆盖度声明：让"本工具能教教材的多少"是可见的，而不是藏在文档里。 */
export function coverageOf(points) {
  const covered = points.filter((p) => p.covered).length;
  const byKind = {};
  for (const p of points) {
    const k = byKind[p.kind] || (byKind[p.kind] = { total: 0, covered: 0 });
    k.total += 1;
    if (p.covered) k.covered += 1;
  }
  return { total: points.length, covered, rate: points.length ? Number((100 * covered / points.length).toFixed(1)) : 0, byKind };
}
