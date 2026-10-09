// ECDICT 英汉词典接入层。
//
// 数据来源：https://github.com/skywind3000/ECDICT （ecdict-sqlite-28）
// 数据库不进版本库，放在 .dict-cache/stardict.db；用 `npm run dict:fetch` 获取。
//
// 本文件只做两件事：
//   1. 把 ECDICT 的一行原始记录解析成结构化条目（纯函数，可单元测试）
//   2. 提供只读查询句柄
//
// 解析结果刻意保留“义项属于哪个词性”这一层，因为语境消歧的第一步就是词性过滤。
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_DB = path.resolve(process.env.LAMPLIT_DICT || '.dict-cache/stardict.db');

/** ECDICT 的词性缩写统一到本项目使用的规范形式。 */
const POS_ALIASES = new Map(Object.entries({
  n: 'n', 'n.': 'n', noun: 'n',
  v: 'v', 'v.': 'v', verb: 'v',
  vt: 'vt', 'vt.': 'vt', 'v.t.': 'vt',
  vi: 'vi', 'vi.': 'vi', 'v.i.': 'vi',
  a: 'adj', 'a.': 'adj', adj: 'adj', 'adj.': 'adj', adjective: 'adj',
  ad: 'adv', 'ad.': 'adv', adv: 'adv', 'adv.': 'adv', adverb: 'adv',
  prep: 'prep', 'prep.': 'prep', preposition: 'prep',
  conj: 'conj', 'conj.': 'conj', conjunction: 'conj',
  pron: 'pron', 'pron.': 'pron', pronoun: 'pron',
  num: 'num', 'num.': 'num', numeral: 'num',
  int: 'int', 'int.': 'int', interj: 'int', 'interj.': 'int',
  art: 'art', 'art.': 'art', article: 'art',
  aux: 'aux', 'aux.': 'aux', 'aux.v.': 'aux',
  abbr: 'abbr', 'abbr.': 'abbr',
  pl: 'pl', 'pl.': 'pl',
  // 领域标记（[计] 播放 / [医] …）保留为领域义项，不与通用义项混排
  '医': 'domain:医', '计': 'domain:计', '经': 'domain:经', '化': 'domain:化',
  '法': 'domain:法', '生': 'domain:生', '物': 'domain:物', '数': 'domain:数',
  '机': 'domain:机', '电': 'domain:电', '商': 'domain:商', '农': 'domain:农',
}));

/** 词性排序权重：越常用的词性越靠前，用于稳定排序。 */
export const POS_ORDER = ['n', 'v', 'vt', 'vi', 'adj', 'adv', 'prep', 'conj', 'pron', 'num', 'int', 'art', 'aux', 'abbr', 'pl'];

export function normalizePos(token) {
  if (!token) return 'other';
  const t = token.trim().toLowerCase();
  if (POS_ALIASES.has(t)) return POS_ALIASES.get(t);
  // [计] 这类领域标记
  const bracket = token.trim().match(/^\[([^\]]+)\]$/);
  if (bracket) return `domain:${bracket[1]}`;
  const bare = t.replace(/\.$/, '');
  if (POS_ALIASES.has(bare)) return POS_ALIASES.get(bare);
  return 'other';
}

/** 形态说明而非词义："leave的过去式和过去分词"、"play的三单形式"。 */
const MORPH_NOTE = /^[A-Za-z][A-Za-z'\- ]*的(过去式|过去分词|现在分词|三单形式|第三人称单数|复数形式|复数|比较级|最高级|原形|缩写|分词)/;

/** 英文定义行有时省略词性后的点号（"n a building where…"），只认完整拼写以免误判。 */
const BARE_POS = /^(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|art|aux)\s+(.+)$/;

/** 拆一行 "n. 游戏, 游玩" / "[计] 播放" / "n a building where…" / "纯文本"。 */
function splitLine(line) {
  const m = line.match(/^(\[[^\]]+\]|[A-Za-z]+\.)\s*(.*)$/);
  if (m) return { pos: normalizePos(m[1]), body: m[2] };
  const bare = line.match(BARE_POS);
  if (bare) return { pos: normalizePos(bare[1]), body: bare[2] };
  return { pos: 'other', body: line };
}

/** 中文义项用逗号/分号分隔；英文定义一行一条，不拆。 */
function splitZh(body) {
  return body.split(/[,，;；]/).map((s) => s.trim()).filter(Boolean);
}

/** "i:playing/p:played/d:played/3:plays/s:plays" → { i:['playing'], p:['played'], ... } */
export function parseExchange(exchange) {
  const out = { i: [], p: [], d: [], 3: [], s: [], r: [], t: [], 0: [], 1: [] };
  if (!exchange) return out;
  for (const part of String(exchange).split('/')) {
    const at = part.indexOf(':');
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (!key || !value) continue;
    if (!out[key]) out[key] = [];
    if (!out[key].includes(value)) out[key].push(value);
  }
  return out;
}

/** "n:19/v:81" → { n: 19, v: 81 }；缺失时返回空对象，不猜测。 */
export function parsePosRatio(pos) {
  const out = {};
  if (!pos) return out;
  for (const part of String(pos).split('/')) {
    const [k, v] = part.split(':');
    const weight = Number(v);
    if (k && Number.isFinite(weight)) out[normalizePos(k)] = weight;
  }
  return out;
}

/**
 * 把 ECDICT 的一行解析成结构化条目。
 * 纯函数：不碰数据库，单元测试可以直接喂 fixture。
 */
export function parseEntry(row) {
  if (!row || !row.word) return null;
  const translationLines = String(row.translation || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const definitionLines = String(row.definition || '').split('\n').map((s) => s.trim()).filter(Boolean);

  /** @type {{pos:string, zh:string[], en:string[]}[]} */
  const senses = [];
  /** 形态说明独立存放，不混入词义，否则会污染词性比例与语境选择。 */
  const morphology = [];
  const byPos = (pos) => senses.filter((s) => s.pos === pos);

  for (const line of translationLines) {
    const { pos, body } = splitLine(line);
    const zh = splitZh(body);
    if (!zh.length) continue;
    // "leave的过去式和过去分词" 这类不是词义
    if (zh.every((z) => MORPH_NOTE.test(z))) {
      morphology.push(...zh);
      continue;
    }
    // 同一词性的多行合并成一组，避免 n. 出现两次
    const existing = byPos(pos).find((s) => s.zhOnly !== false);
    if (existing && existing.zh.length && existing.zh.length + zh.length <= 24) existing.zh.push(...zh);
    else senses.push({ pos, zh: [...zh], en: [], zhOnly: true });
  }

  // 英文定义按行进来，对齐到同词性的中文组；找不到就单开一组
  for (const line of definitionLines) {
    const { pos, body } = splitLine(line);
    if (!body) continue;
    const target = byPos(pos).find((s) => s.en.length === 0) || byPos(pos)[0];
    if (target) target.en.push(body);
    else senses.push({ pos, zh: [], en: [body] });
  }

  for (const s of senses) delete s.zhOnly;

  // 刻意不按词性重排：ECDICT 的 translation 顺序本身就是「常用义在前」，
  // 这正是「核心义 ≈ 词典首义」这一设计的依据。重排会把它破坏掉。
  // 词性排序只在展示端做分组，不参与消歧。

  const posRatio = parsePosRatio(row.pos);
  const exchange = parseExchange(row.exchange);

  return {
    word: row.word,
    phonetic: row.phonetic || '',
    /** 柯林斯星级 0–5；0 表示无评级 */
    collins: Number(row.collins) || 0,
    oxford: Number(row.oxford) === 1,
    /** 考纲标签：zk 中考 / gk 高考 / cet4 / cet6 / ky 考研 / toefl / ielts / gre */
    tags: String(row.tag || '').split(/\s+/).filter(Boolean),
    bnc: Number(row.bnc) || 0,
    frq: Number(row.frq) || 0,
    posRatio,
    senses: senses.filter((s) => s.zh.length || s.en.length),
    morphology,
    exchange,
    /** 由 exchange 推导的原形；自身即原形时等于 word */
    lemma: exchange[0]?.[0] || row.word,
    /** 所有屈折形式（不含自身） */
    forms: [...new Set(['i', 'p', 'd', '3', 's', 'r', 't'].flatMap((k) => exchange[k] || []))].filter((f) => f && f !== row.word),
  };
}

/** 打开只读词典句柄。数据库缺失时抛出的错误直接告诉用户怎么修。 */
export function openDict(dbPath = DEFAULT_DB) {
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `找不到 ECDICT 数据库：${dbPath}\n` +
      `运行 npm run dict:fetch 下载（约 207MB，解压后 812MB，落在 .dict-cache/）。`,
    );
  }
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const byWord = db.prepare('SELECT word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange FROM stardict WHERE word = ? COLLATE NOCASE LIMIT 1');
  const bySw = db.prepare('SELECT word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange FROM stardict WHERE sw = ? COLLATE NOCASE LIMIT 1');
  const prefix = db.prepare('SELECT word FROM stardict WHERE word LIKE ? ORDER BY frq ASC LIMIT 20');
  return {
    dbPath,
    /** 精确查询（不区分大小写），失败后回退到 sw（去标点形式）。 */
    raw(word) {
      if (!word) return null;
      return byWord.get(word) || bySw.get(word) || null;
    },
    lookup(word) {
      return parseEntry(this.raw(word));
    },
    /** 前缀补全，用于拼写变体的兜底查找。 */
    prefixed(prefixText) {
      return prefix.all(`${prefixText}%`).map((r) => r.word);
    },
    close() {
      db.close();
    },
  };
}
