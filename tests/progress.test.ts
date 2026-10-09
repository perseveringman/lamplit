import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageOf, retentionOf, masteryOf, streakOf, isFinished } from '../src/lib/progress.ts';
import type { UserData } from '../src/lib/types.ts';

const DAY = 86400000;
const base = (over: Partial<UserData> = {}): UserData => ({
  version: 2, revision: 0, cards: {}, flags: {}, reviews: [], retention: 0.9,
  reading: null, bookmarks: {}, welcomeDismissed: false, session: null, readerSize: 20,
  layers: { pattern: true, grammar: true, chunk: true, word: false, connective: false, genre: true },
  lessons: {}, ...over,
});

test('覆盖：只算有阅读记录的课，与卡片无关', () => {
  const d = base({
    lessons: {
      a: { state: 'reading', firstReadAt: 1, lastReadAt: 100, readCount: 1 },
      b: { state: 'read', firstReadAt: 1, lastReadAt: 200, readCount: 2 },
      // lastReadAt 为 0：迁移前就在读，不清楚何时读过 —— 不计入
      c: { state: 'reading', firstReadAt: 0, lastReadAt: 0, readCount: 0 },
    },
  });
  const r = coverageOf(d, 4);
  assert.equal(r.lessonsRead, 2, 'lastReadAt 为 0 的课不应计入覆盖');
  assert.equal(r.lessonsFinished, 1);
  assert.equal(r.rate, 50);
});

test('沉淀：区分「有卡」与「已进入复习期」与「已成熟」', () => {
  const card = (state: string, stability: number) => ({ state, stability });
  const d = base({
    cards: {
      a: card('learning', 1) as never,
      b: card('review', 5) as never,
      c: card('review', 30) as never,
    },
  });
  const r = retentionOf(d);
  assert.equal(r.cards, 3);
  assert.equal(r.inReview, 2);
  assert.equal(r.mature, 1, 'stability >= 21 才算成熟');
});

test('掌握：只统计复习期内的回忆，没有记录时是 null 而不是 0', () => {
  const log = (previousState: string, grade: number) => ({ previousState, grade, at: 0 });
  const d = base({
    reviews: [
      log('new', 3), log('learning', 3),           // 学习期，必然成功率高 —— 不计入
      log('review', 3), log('review', 1), log('review', 4),
    ] as never,
  });
  const r = masteryOf(d);
  assert.equal(r.attempts, 3, '只数 previousState === review');
  assert.equal(r.successes, 2, 'grade > 1 算成功');
  assert.equal(r.rate, 66.7);
  assert.equal(masteryOf(base()).rate, null, '没有复习记录时是 null，不是 0');
});

test('连续天数：只读课文不复习的日子也要算', () => {
  const now = 10 * DAY + 3600000;
  const d = base({
    // 前两天只读课文，没复习 —— 旧实现会在这里断掉
    lessons: {
      a: { state: 'reading', firstReadAt: 0, lastReadAt: 8 * DAY, readCount: 1 },
      b: { state: 'reading', firstReadAt: 0, lastReadAt: 9 * DAY, readCount: 1 },
      c: { state: 'reading', firstReadAt: 0, lastReadAt: 10 * DAY, readCount: 1 },
    },
    reviews: [],
  });
  assert.equal(streakOf(d, now), 3);
  // 今天还没学，昨天学过 → 连续段保留
  assert.equal(streakOf(d, 11 * DAY), 3);
  // 隔了一整天没学 → 断
  assert.equal(streakOf(d, 12 * DAY), 0);
});

test('读完：visited >= 80% 或手动标记', () => {
  assert.equal(isFinished({ state: 'read' }, 10), true);
  assert.equal(isFinished({ visited: Array(8).fill('s') }, 10), true);
  assert.equal(isFinished({ visited: Array(7).fill('s') }, 10), false);
  assert.equal(isFinished(undefined, 10), false);
  assert.equal(isFinished({ visited: [] }, 0), false, '句子数为 0 时不应判为读完');
});
