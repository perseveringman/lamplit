// 词典解析与语境消歧的单元测试。
//
// 这些函数被刻意写成纯函数（不碰数据库），就是为了能在这里直接被测。
// 它们同时是数据质量的守门人：一旦解析规则被改坏，这里先红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEntry, parseExchange, parsePosRatio, normalizePos } from '../scripts/ecdict.mjs';
import { guessPos, pickSense, trim } from '../scripts/senses.mjs';

const row = (over = {}) => ({
  word: 'play',
  phonetic: 'plei',
  definition: 'n. a dramatic work intended for performance by actors on a stage\nv. engage in an activity for enjoyment',
  translation: 'n. 游戏, 游玩, 玩笑, 表演, 剧本\nv. 玩, 游戏, 扮演\n[计] 播放',
  pos: 'n:19/v:81',
  collins: 5,
  oxford: 1,
  tag: 'zk gk',
  bnc: 224,
  frq: 200,
  exchange: 'i:playing/p:played/d:played/3:plays/s:plays',
  ...over,
});

test('parseEntry: 义项按词性分组，且保留词典自身的常用度顺序', () => {
  const e = parseEntry(row());
  assert.equal(e.word, 'play');
  assert.equal(e.collins, 5);
  assert.equal(e.oxford, true);
  assert.deepEqual(e.tags, ['zk', 'gk']);
  // n 在前是 ECDICT 原文顺序——「核心义 ≈ 词典首义」靠的就是这个顺序，
  // 按词性重排会把它破坏掉
  assert.equal(e.senses[0].pos, 'n');
  assert.ok(e.senses[0].zh.includes('游戏'));
  assert.ok(e.senses[0].zh.includes('剧本'));
  assert.equal(e.senses[0].en.length, 1, '英文定义要对齐到同词性的组');
});

test('parseEntry: 领域标记单独成组，不混进通用义项', () => {
  const e = parseEntry(row());
  const domain = e.senses.find((s) => s.pos.startsWith('domain:'));
  assert.ok(domain, '领域义项应保留但单独分组');
  assert.deepEqual(domain.zh, ['播放']);
});

test('parseEntry: 形态说明不算词义', () => {
  const e = parseEntry(row({
    word: 'left', translation: 'a. 左边的, 左倾的\nleave的过去式和过去分词', definition: '', pos: '', exchange: '0:leave',
  }));
  assert.deepEqual(e.morphology, ['leave的过去式和过去分词']);
  assert.ok(!e.senses.some((s) => s.zh.some((z) => z.includes('过去式'))), '形态说明不得进入 senses');
  assert.equal(e.lemma, 'leave');
});

test('parseEntry: 英文定义省略点号时要认出词性（"n a building where…"）', () => {
  const e = parseEntry(row({ word: 'theatre', translation: 'n. 戏院, 剧场', definition: 'n a building where plays are performed', pos: '', exchange: '' }));
  assert.equal(e.senses.length, 1);
  assert.equal(e.senses[0].pos, 'n');
  assert.equal(e.senses[0].en[0], 'a building where plays are performed');
});

test('parseExchange / parsePosRatio', () => {
  const ex = parseExchange('i:playing/p:played/d:played/3:plays/s:plays');
  assert.deepEqual(ex.i, ['playing']);
  assert.deepEqual(ex.p, ['played']);
  assert.equal(ex['0'].length, 0);
  assert.deepEqual(parsePosRatio('n:19/v:81'), { n: 19, v: 81 });
  assert.deepEqual(parsePosRatio(''), {});
  assert.equal(normalizePos('vt.'), 'vt');
  assert.equal(normalizePos('adj'), 'adj');
  assert.equal(normalizePos('[计]'), 'domain:计');
});

test('guessPos: 限定词后是名词，主语代词后是动词，be 后是形容词', () => {
  assert.equal(guessPos(['the', 'play', 'was'], 1), 'n');
  assert.equal(guessPos(['i', 'play', 'football'], 1), 'v');
  // was + Ving/Ved 一律读作动词（分词）：interesting 也可能是分词，
  // 猜错词性不会出错，pickSense 命不中词性时会退回词典首义
  assert.equal(guessPos(['was', 'interesting'], 1), 'v');
  assert.equal(guessPos(['is', 'happy'], 1), 'adj');
  assert.equal(guessPos(['very', 'good'], 1), 'adj');
  assert.equal(guessPos(['quickly', 'ran'], 0), 'adv');
});

test('pickSense: 单义直接取，词性命中优先，否则取首义', () => {
  const entry = parseEntry(row());
  assert.equal(pickSense(entry, 'n').sense.pos, 'n', 'the play → 名词组');
  assert.equal(pickSense(entry, 'v').sense.pos, 'v', 'i play → 动词组');
  // 没有词性线索时取词典首义，而不是按词性比例推
  // （good 的 posRatio 是 other:94/n:4，据此推会得到名词「善行」）
  assert.equal(pickSense(entry, null).sense.pos, 'n');
  const single = parseEntry(row({ translation: 'n. 手提包', definition: '', pos: '', exchange: '' }));
  assert.equal(pickSense(single, null).method, 'single-sense');
});

test('pickSense: 没有中文义项时给出英文义项，中文由上层回退到原形', () => {
  const entry = parseEntry(row({ word: 'went', translation: '', definition: 'v change location', pos: '', exchange: '0:go' }));
  assert.equal(entry.senses.every((s) => s.zh.length === 0), true);
  const picked = pickSense(entry, 'v');
  // 中文为空时退回英文释义而不是编一个中文；
  // resolveSense 会因为 zh 为空而走 chooseSource 的 lemma 回退（went → go）
  assert.equal(picked.method, 'english-only');
  assert.equal(picked.sense.zh.length, 0);
  assert.ok(picked.sense.en[0].includes('change location'));
});

test('trim: 同时限制义项个数与总字数', () => {
  assert.equal(trim(['伞', '雨伞', '保护伞']), '伞；雨伞…');
  assert.equal(trim(['伞']), '伞');
  assert.equal(trim(['戏剧', '玩']), '戏剧；玩');
  // 缩略语词条会给出整屏的释义，只限个数拦不住
  const long = trim(['美国机械工程师学会（Association of the Institute of Mechanical Engineers）', '美国采矿工程师协会（American Institute of Mining Engineers）']);
  assert.ok([...long].length <= 25, `总长应被截断，实际 ${[...long].length} 字：${long}`);
  assert.ok(long.endsWith('…'));
});
