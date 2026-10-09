/**
 * 每册角色（bookRole）——引入册来自教材事实，不来自统计推断。
 *
 * 为什么不用统计：曾试图用「每课平均命中翻倍」推断引入册，
 * 结果把第一册就教过的时态推到了二、三册（句长变化被误当成引入）。
 * 教材的教学编排是人写的，只能查证（原则 11）。
 *
 * 事实来源（每一条都在两套独立材料里核过）：
 *   - 新东方《新概念英语第一册课文语法点总结·时态递进表》
 *   - protogenesis/New-Concept-English NCE1.md 逐课笔记
 *   两份材料在「哪一课引入哪个时态」上 21 项全部一致，故采信。
 *
 * 未能核实引入册的规则一律留空（null），不做猜测。
 * 「对比（contrast）」「流利（fluency）」两种角色需要教学意图数据，
 * 语料推不出来，留待 C 组（教学点抽取）填充。
 */

/** 规则 id → 引入册。只收录有教材依据的条目。 */
export const INTRODUCE_BOOK = {
  // 第一册（新东方时态递进表 ×NCE1.md，21 项一致）
  'g-question': 1,            // L1-2   主系表一般疑问句
  'g-wh-question': 1,         // L7-8   特殊疑问句
  'g-imperative': 1,          // L29-30 祈使句
  'g-existential': 1,         // L19    there be
  'g-quantity': 1,            // L27    some / any
  'g-present-continuous': 1,  // L31-34 现在进行时
  'g-going-to': 1,            // L37-40 be going to
  'g-modal': 1,               // L40    情态动词
  'g-present': 1,             // L51-56 一般现在时
  'g-past': 1,                // L67-76 一般过去时
  'g-present-perfect': 1,     // L83-90 现在完成时
  'g-future': 1,              // L91-96 一般将来时 will
  'g-object': 1,              // L103-104 宾语从句
  'g-infinitive': 1,          // L105   动词不定式
  'g-comparative': 1,         // L107-112 比较级
  'g-superlative': 1,         // L107-112 最高级
  'g-past-continuous': 1,     // L117-118 过去进行时
  'g-past-perfect': 1,        // L119-120 过去完成时
  'g-relative': 1,            // L121-124 定语从句
  'g-exclamation': 1,         // L124   感叹句
  'g-deduction': 1,           // L125-132 情态动词表推测
  'g-condition': 1,           // L137-140 if 条件
  'g-indirect-question': 1,   // L140   疑问词引导宾语从句
  'g-passive': 1,             // L141-144 被动语态
};

/**
 * 规则 id → [册, 官方课号]：教材**具体在哪一课**引入它。
 * 只有第一册有这份依据（新东方时态递进表 × NCE1.md，两份材料 21 项一致）。
 *
 * 为什么需要课级：只按册过滤时，第一册第 4 课会选出「被动语态」——
 * 它确实属于第一册，但教材到 L141 才教。册级粒度太粗。
 */
export const INTRODUCE_LESSON = {
  'g-present-continuous': [1, 31],
  'g-going-to': [1, 37],
  'g-present': [1, 51],
  'g-past': [1, 67],
  'g-present-perfect': [1, 83],
  'g-future': [1, 91],
  'g-past-continuous': [1, 117],
  'g-past-perfect': [1, 119],
  'g-relative': [1, 121],
  'g-passive': [1, 141],
  // 以下同样来自新东方第一册时态递进表（同一份材料）。
  // 前 10 条在 NCE1.md 里逐条交叉验证过（21 项全一致），故整表可信；
  // 这几条未单独二次核对，标注在此以便日后补验。
  'g-question': [1, 1],
  'g-wh-question': [1, 7],
  'g-existential': [1, 19],
  'g-quantity': [1, 27],
  'g-imperative': [1, 29],
  'g-modal': [1, 40],
  'g-object': [1, 103],
  'g-infinitive': [1, 105],
  'g-comparative': [1, 107],
  'g-superlative': [1, 107],
  'g-exclamation': [1, 124],
  'g-deduction': [1, 126],
  'g-condition': [1, 137],
  'g-indirect-question': [1, 140],
};

/** 该规则是否已经在「某册的第几课」教过。没有课级依据时退回册级判断。 */
export function introducedBy(kpId, book, lessonNo) {
  const at = INTRODUCE_LESSON[kpId];
  if (at) return book > at[0] || (book === at[0] && lessonNo >= at[1]);
  const intro = introduceBookOf(kpId);
  return intro === null || intro <= book;
}

/** 引入册未知的规则不参与过滤（视为一直可用）。 */
export function introduceBookOf(kpId) {
  return Object.prototype.hasOwnProperty.call(INTRODUCE_BOOK, kpId) ? INTRODUCE_BOOK[kpId] : null;
}

/**
 * 计算某条规则在某一册的角色。
 *
 *   book <  引入册        → null（这一册还没教）
 *   book === 引入册       → 'introduce'
 *   book >  引入册 且出现 → 'reuse'（在这一册被再次使用）
 *   其它                  → null
 *
 * 刻意不产出 'contrast' / 'fluency'：区分这两者需要「这一课是拿来对比还是拿来运用」
 * 的教学意图，语料统计给不出，猜出来的标签比没有标签更糟。
 */
export function bookRoleOf(kpId, book, appearsInBook) {
  const intro = introduceBookOf(kpId);
  if (intro === null) return appearsInBook ? 'reuse' : null;
  if (book < intro) return null;
  if (book === intro) return 'introduce';
  return appearsInBook ? 'reuse' : null;
}
