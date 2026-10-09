import type { UserData, MemoryCard } from './types';

/**
 * 进度三条轴。
 *
 * **刻意不做成一个复合百分比。** 三条轴不同步本身是信息：
 *   「覆盖高 / 沉淀低」= 读得多但没留下东西
 *   「覆盖低 / 掌握高」= 反复磨少数几课
 * 合成一个数字会把这层信息抹掉。
 *
 * 时间口径：`now` 由调用方传入，函数保持纯函数，便于测试。
 */

/** 成熟卡的稳定度门槛（天）。沿用 Anki 的约定。 */
export const MATURE_STABILITY = 21;

export interface CoverageAxis {
  /** 有阅读记录的课数 */
  lessonsRead: number;
  /** 全部课数 */
  lessonsTotal: number;
  /** 覆盖率（%） */
  rate: number;
  /** 读完的课数（visited 覆盖 >= 80%，或标记为 read） */
  lessonsFinished: number;
}

export interface RetentionAxis {
  /** 卡片总数 */
  cards: number;
  /** 已进入复习期的卡片数 */
  inReview: number;
  /** 稳定度达到成熟门槛的卡片数 */
  mature: number;
}

export interface MasteryAxis {
  /** 复习期内的回忆次数（分子） */
  attempts: number;
  /** 复习期内回忆成功次数（分母） */
  successes: number;
  /** 复习期成功率（%）；没有复习记录时为 null，不是 0 */
  rate: number | null;
}

/** 覆盖：读了多少。只看阅读行为，不看卡片。 */
export function coverageOf(data: UserData, lessonsTotal: number): CoverageAxis {
  const entries = Object.values(data.lessons || {});
  const lessonsRead = entries.filter((l) => (l.lastReadAt || 0) > 0).length;
  const lessonsFinished = entries.filter((l) => l.state === 'read').length;
  return {
    lessonsRead,
    lessonsTotal,
    rate: lessonsTotal ? Number(((100 * lessonsRead) / lessonsTotal).toFixed(1)) : 0,
    lessonsFinished,
  };
}

/** 沉淀：留下了多少。看卡片状态，不看阅读行为。 */
export function retentionOf(data: UserData): RetentionAxis {
  const cards = Object.values(data.cards || {}) as MemoryCard[];
  return {
    cards: cards.length,
    inReview: cards.filter((c) => c.state === 'review').length,
    mature: cards.filter((c) => (c.stability || 0) >= MATURE_STABILITY).length,
  };
}

/**
 * 掌握：复习期内回忆成功的比例。
 *
 * 只统计**进入复习期之后**的回忆（`previousState === 'review'`）。
 * 学习期的回忆必然成功率高（刚看过），混进来会把掌握度整体抬高。
 */
export function masteryOf(data: UserData): MasteryAxis {
  const logs = data.reviews || [];
  const graded = logs.filter((r) => r.previousState === 'review');
  const successes = graded.filter((r) => r.grade > 1).length;
  return {
    attempts: graded.length,
    successes,
    rate: graded.length ? Number(((100 * successes) / graded.length).toFixed(1)) : null,
  };
}

/**
 * 连续学习天数。
 *
 * 旧实现只统计 `reviews` 的日期——**只读课文不复习的日子不算数**，
 * 于是"每天都打开来读"的用户会看到连续天数断掉。
 * 现在把阅读记录（lessons[].lastReadAt）一并计入。
 */
export function streakOf(data: UserData, now: number): number {
  const dayOf = (t: number) => Math.floor(t / 86400000);
  const days = new Set<number>();
  for (const r of data.reviews || []) days.add(dayOf(r.at));
  for (const l of Object.values(data.lessons || {})) if (l.lastReadAt) days.add(dayOf(l.lastReadAt));
  if (!days.size) return 0;
  const today = dayOf(now);
  // 今天还没学也保留昨天开始的连续段（当天未结束，不算断）
  let cursor = days.has(today) ? today : today - 1;
  if (!days.has(cursor)) return 0;
  let n = 0;
  while (days.has(cursor)) { n += 1; cursor -= 1; }
  return n;
}

/** 某一课读了多少句。visited 缺失时退回 lastSentenceId 之前的部分。 */
export function visitedCount(progress: { visited?: string[] } | undefined, sentenceCount: number): number {
  if (!progress) return 0;
  const n = progress.visited?.length || 0;
  return Math.min(n, sentenceCount);
}

/** 一课是否算「读完」：看过 >= 80% 的句子，或手动标记。 */
export function isFinished(progress: { state?: string; visited?: string[] } | undefined, sentenceCount: number): boolean {
  if (!progress) return false;
  if (progress.state === 'read') return true;
  if (!sentenceCount) return false;
  return visitedCount(progress, sentenceCount) / sentenceCount >= 0.8;
}
