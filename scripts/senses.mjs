// 语境释义解析：把一个词条在「某一句里的某一次出现」解析成具体义项。
//
// 这是 Step 1–2 的核心。设计原则来自三个约束：
//   1. 释义挂在「出现」上，不挂在「词」上——否则 play 只能同时显示 戏剧/玩/演奏
//   2. 语块优先于单词——"on the left" 里的 left 属于语块，不该走 left 的词义
//   3. 机械能定的绝不留给模型——词性过滤能定的，就不该花一次 LLM 调用
//
// 输出刻意带 method 字段，好让上层统计「多少条靠规则定了、还剩多少条要模型」。

/** 出现在名词前的限定词/所有格。 */
const DET = new Set(['a', 'an', 'the', 'my', 'your', 'his', 'her', 'our', 'their', 'its', 'this', 'that', 'these', 'those', 'some', 'any', 'no', 'every', 'each', 'another', 'both', 'such']);
/** 出现在动词前的成分。 */
const SUBJ = new Set(['i', 'you', 'he', 'she', 'we', 'they', 'it', 'who', 'that', 'which', 'there']);
const AUX = new Set(['will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'do', 'does', 'did', 'not', 'to', 'never', 'always', 'often', 'usually', 'sometimes', 'just', 'already', 'still', 'also', 'only', 'please']);
const BE = new Set(['be', 'am', 'is', 'are', 'was', 'were', 'been', 'being', "isn't", "aren't", "wasn't", "weren't"]);
const DEGREE = new Set(['very', 'quite', 'so', 'too', 'more', 'most', 'rather', 'extremely', 'fairly', 'really', 'almost', 'nearly']);

function tokenize(text) {
  return String(text || '').match(/[A-Za-z][A-Za-z'’-]*/g) || [];
}

/**
 * 从上下文猜词性。不用依存分析，只用限定词/主语/助动词/程度副词这几个强信号。
 * 返回规范词性字符串，无法判断时返回 null（交给词典词性比例兜底）。
 */
export function guessPos(tokens, index) {
  const word = (tokens[index] || '').toLowerCase();
  const prev = (tokens[index - 1] || '').toLowerCase();
  const prev2 = (tokens[index - 2] || '').toLowerCase();
  const next = (tokens[index + 1] || '').toLowerCase();

  // 形态线索优先：-ly 基本都是副词
  if (/ly$/.test(word) && word.length > 4) return 'adv';

  // be + Ving / be + Ved → 动词（分词）
  if (BE.has(prev) && (/(ing|ed|en)$/.test(word) || /^(born|gone|done|made|taken|given|written|spoken|broken|chosen|driven|eaten|fallen|forgotten|known|seen|shown|stolen|thrown|worn)$/.test(word))) return 'v';

  // 限定词 / 所有格之后 → 名词
  if (DET.has(prev)) return 'n';
  // 主语代词 + 词 / 助动词 + 词 → 动词
  if (SUBJ.has(prev)) return 'v';
  if (AUX.has(prev)) return 'v';
  if (BE.has(prev)) return 'adj';
  // 程度副词之后 → 形容词
  if (DEGREE.has(prev)) return 'adj';
  // 介词 + 限定词 → 名词（"on the left" / "of the world"）
  if ((DET.has(prev2) || DET.has(prev)) && !next) return 'n';
  if (next && DET.has(next)) return 'n';
  return null;
}

/** 词性一族：v/vt/vi 视作同一类，便于匹配。 */
function posFamily(pos) {
  if (pos === 'vt' || pos === 'vi') return 'v';
  return pos;
}

/**
 * 词典的义项列表动辄八九条（umbrella = 伞/雨伞/保护伞/伞的/包罗万象的/用伞遮掩）。
 * 全量塞给学习者等于没有释义——文章说的「重点理解前面一两个意思」就是这个意思。
 *
 * 两道限制都要有：义项个数，以及总字数。缩略语词条会给出
 * 「美国机械工程师学会（Association of…）；美国采矿工程师协会（…）」这种
 * 一整屏的释义，只限个数拦不住。
 */
export function trim(items, max = 2, maxLength = 24) {
  const list = (items || []).filter(Boolean);
  const shown = list.slice(0, max || list.length);
  const joined = shown.join('；');
  const dropped = list.length > shown.length;
  if ([...joined].length <= maxLength) return dropped ? `${joined}…` : joined;
  const chars = [...joined];
  const cut = joined.slice(0, chars.slice(0, maxLength).join('').length);
  const lastSep = Math.max(cut.lastIndexOf('；'), cut.lastIndexOf('，'), cut.lastIndexOf(','));
  const body = lastSep > 6 ? cut.slice(0, lastSep) : cut;
  return `${body}…`;
}

/**
 * 决定用「词形自身词条」还是「原形词条」。
 *
 * ECDICT 给很多屈折形式也建了独立词条，而那条常常是同形异义词：
 *   pictures → 电影院   （应为 picture 图片）
 *   books    → 书评     （应为 book 书）
 *   went     → 无中文义项（必须走 go）
 * 反过来 left（左边的）本身就是一个高频独立词，不能硬推回 leave。
 *
 * ECDICT 的 frq 词频排名正好是那个裁判：无排名(0) 说明只是附带收录的变体，
 * 有排名且更靠前说明它自己就是常用词。两边都有排名时取更常用的那个。
 */
function chooseSource(entry, lookup) {
  if (!entry) return { source: null, method: '' };
  const hasZh = (e) => !!e?.senses?.some((s) => s.zh.length);
  const lemmaEntry = entry.lemma && entry.lemma !== entry.word ? lookup?.(entry.lemma) : null;

  // 自身没有中文义项：只能靠原形（went / men / told 这一大类）
  if (!hasZh(entry)) {
    return hasZh(lemmaEntry) ? { source: lemmaEntry, method: 'lemma' } : { source: entry, method: '' };
  }
  if (!hasZh(lemmaEntry)) return { source: entry, method: '' };

  // 自身没有词频排名 → 是附带收录的变体，走原形
  if (!entry.frq && lemmaEntry.frq) return { source: lemmaEntry, method: 'lemma' };
  // 两边都有排名 → 取更常用的
  if (entry.frq && lemmaEntry.frq && lemmaEntry.frq < entry.frq) return { source: lemmaEntry, method: 'lemma' };
  return { source: entry, method: '' };
}

/**
 * 在词典义项里挑一个。
 * @param {{senses:{pos:string,zh:string[],en:string[]}[], posRatio:Record<string,number>, morphology:string[]}} entry
 * @param {string|null} posHint 上下文猜出的词性
 * @returns {{sense:object, method:string}|null}
 */
export function pickSense(entry, posHint) {
  if (!entry || !entry.senses?.length) return null;
  const senses = entry.senses.filter((s) => s.zh.length);
  if (!senses.length) {
    // 只有英文释义（多见于生僻义项），退回第一条英文
    const en = entry.senses.find((s) => s.en.length);
    return en ? { sense: en, method: 'english-only' } : null;
  }
  if (senses.length === 1) return { sense: senses[0], method: 'single-sense' };

  if (posHint) {
    const family = posFamily(posHint);
    const matched = senses.filter((s) => posFamily(s.pos) === family);
    if (matched.length === 1) return { sense: matched[0], method: 'pos-match' };
    if (matched.length > 1) {
      // 同词性多义：保留词典自身的常用度顺序，取第一条
      return { sense: matched[0], method: 'pos-match-multi' };
    }
  }

  // 没有词性线索（或线索没命中）：词典首义就是「核心义」，优先于词性比例。
  // 词性比例在本语料上不可靠——ECDICT 的 pos 字段常被 other 占据多数
  // （good 是 other:94/n:4，please 是 other:84/v:16），据此选择会把
  // "Good morning" 的 good 判成名词「善行」。
  const first = senses[0];
  if (first) return { sense: first, method: 'first-sense' };

  return null;
}

/**
 * 解析一次出现的语境释义。
 *
 * @param {object} args
 * @param {string} args.text        所在句子的原文
 * @param {number} args.start       命中起点（UTF-16）
 * @param {number} args.end         命中终点
 * @param {object} args.entry       词典条目（可为 null）
 * @param {{name:string, meaning?:string}|null} args.coveringChunk 完整覆盖本次出现的语块
 * @param {string|null} args.inlineNote 源文自带的中文旁注
 * @param {string|null} args.editorial 现有编辑词表里这个词条的释义
 * @param {(word:string)=>object|null} [args.lookup] 原形回退用的查词函数
 * @param {number} [args.maxGlossItems] 展示端最多保留几个义项（默认 2）
 */
export function resolveSense({
  text, start, end, entry, coveringChunk = null, inlineNote = null,
  editorial = null, lookup = null, maxGlossItems = 2,
}) {
  // 1. 源文旁注是出现级证据，优先级最高
  if (inlineNote) {
    return { zh: inlineNote, en: '', pos: null, method: 'source-inline', sense: null };
  }

  // 2. 语块完整覆盖：这个位置的词义属于语块，不单独给单词释义
  if (coveringChunk) {
    return {
      zh: coveringChunk.meaning || '',
      en: '',
      pos: null,
      method: 'chunk',
      sense: null,
      chunk: coveringChunk.name,
    };
  }

  // 3. 编辑词表的「单义」条目是人工整理的结果，比词典推断可靠。
  //    多义条目（"play|戏剧；玩；演奏"）正是要修的问题，必须交给词典。
  const editorialSenses = editorial ? editorial.split(/[；;]/).map((s) => s.trim()).filter(Boolean) : [];
  if (editorialSenses.length === 1) {
    return { zh: editorialSenses[0], en: '', pos: null, method: 'editorial-single', sense: null };
  }

  if (!entry) {
    return editorialSenses.length
      ? { zh: trim(editorialSenses, maxGlossItems), en: '', pos: null, method: 'editorial-first', sense: null }
      : null;
  }

  const tokens = tokenize(text);
  // 找到命中词在 token 序列里的下标
  const before = String(text).slice(0, start);
  const index = (before.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  const surface = String(text).slice(start, end);
  const at = tokens[index] && tokens[index].toLowerCase() === surface.toLowerCase() ? index : index;
  const posHint = guessPos(tokens, at);

  const { source, method: sourceMethod } = chooseSource(entry, lookup);
  if (!source) {
    return editorialSenses.length
      ? { zh: trim(editorialSenses, maxGlossItems), en: '', pos: null, method: 'editorial-first', sense: null }
      : null;
  }
  const picked = pickSense(source, posHint);
  if (!picked) {
    return editorialSenses.length
      ? { zh: trim(editorialSenses, maxGlossItems), en: '', pos: null, method: 'editorial-first', sense: null }
      : null;
  }

  return {
    zh: trim(picked.sense.zh, maxGlossItems),
    en: picked.sense.en[0] || '',
    pos: picked.sense.pos,
    method: sourceMethod ? `${picked.method}+${sourceMethod}` : picked.method,
    posHint: posHint || '',
    resolvedWord: source.word,
    senseIndex: source.senses.indexOf(picked.sense),
    sense: picked.sense,
  };
}
