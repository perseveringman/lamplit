import type { Entity, Grade, MemoryCard } from './types.ts';
/** FSRS-6 equations and default weights, adapted from FSRS4Anki 6.1.1.
 * Reference commit: 724a2f445adfffb2cc3d7fae7a96ab37b948561c.
 * MIT, Copyright (c) 2022 open-spaced-repetition. See THIRD_PARTY_NOTICES.md.
 * This app owns the 1m/10m learning steps, new-card weak prior and session UI.
 * Fuzz is intentionally disabled for a small personal collection and deterministic tests.
 */
export const WEIGHTS = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542] as const;
export const DAY = 86400000;
const DECAY = -WEIGHTS[20];
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10000) / 10000;
export function initialDifficulty(grade: Grade): number { return clamp(WEIGHTS[4] - Math.exp(WEIGHTS[5] * (grade - 1)) + 1, 1, 10); }
export function retrievability(card: Pick<MemoryCard, 'stability' | 'lastReview'>, now = Date.now()): number {
    if (card.lastReview === null || card.stability <= 0)
        return 0;
    const elapsed = Math.max(0, (now - card.lastReview) / DAY);
    return clamp(Math.pow(1 + FACTOR * elapsed / card.stability, DECAY), 0, 1);
}
export function intervalFor(stability: number, retention = 0.9): number {
    if (!Number.isFinite(stability) || stability <= 0)
        throw new Error('稳定度必须为正数');
    if (!Number.isFinite(retention) || retention < 0.75 || retention > 0.97)
        throw new Error('目标保留率应介于 75% 与 97%');
    return clamp(Math.round(stability / FACTOR * (Math.pow(retention, 1 / DECAY) - 1)), 1, 36500);
}
export function createCard(entity: Entity, weak = false, now = Date.now(), contentVersion = 'nce-source-v1'): MemoryCard {
    return { id: `${entity.kind}:${entity.id}`, entity: { ...entity }, createdAt: now, due: now - (weak ? 60000 : 0), lastReview: null, stability: weak ? 0.05 : 0, difficulty: 0, reps: 0, lapses: 0, state: 'new', paused: false, weakAtCreation: weak, contentVersion };
}
function memoryAfter(card: MemoryCard, grade: Grade, now: number): Pick<MemoryCard, 'difficulty' | 'stability'> {
    if (card.reps === 0 || card.stability <= 0)
        return { difficulty: initialDifficulty(grade), stability: Math.max(0.01, WEIGHTS[grade - 1] * (card.weakAtCreation ? 0.6 : 1)) };
    const s = card.stability, d = card.difficulty, r = retrievability(card, now);
    const delta = -WEIGHTS[6] * (grade - 3);
    const newD = clamp(WEIGHTS[7] * initialDifficulty(4) + (1 - WEIGHTS[7]) * (d + delta * (10 - d) / 9), 1, 10);
    const elapsed = card.lastReview === null ? 0 : Math.max(0, (now - card.lastReview) / DAY);
    let stability: number;
    if (elapsed < 1) {
        let multiplier = Math.exp(WEIGHTS[17] * (grade - 3 + WEIGHTS[18])) * Math.pow(s, -WEIGHTS[19]);
        if (grade >= 3)
            multiplier = Math.max(multiplier, 1);
        stability = s * multiplier;
    }
    else if (grade === 1) {
        stability = Math.min(WEIGHTS[11] * Math.pow(d, -WEIGHTS[12]) * (Math.pow(s + 1, WEIGHTS[13]) - 1) * Math.exp((1 - r) * WEIGHTS[14]), s / Math.exp(WEIGHTS[17] * WEIGHTS[18]));
    }
    else {
        const hardPenalty = grade === 2 ? WEIGHTS[15] : 1, easyBonus = grade === 4 ? WEIGHTS[16] : 1;
        stability = s * (1 + Math.exp(WEIGHTS[8]) * (11 - d) * Math.pow(s, -WEIGHTS[9]) * (Math.exp((1 - r) * WEIGHTS[10]) - 1) * hardPenalty * easyBonus);
    }
    return { difficulty: round(newD), stability: round(clamp(stability, 0.01, 36500)) };
}
export interface Scheduled {
    card: MemoryCard;
    intervalDays: number;
}
export function scheduleOptions(card: MemoryCard, retention = 0.9, now = Date.now()): Record<Grade, Scheduled> {
    if (card.paused)
        throw new Error('请先恢复这张卡片');
    const options = {} as Record<Grade, Scheduled>;
    for (const grade of [1, 2, 3, 4] as Grade[]) {
        const mem = memoryAfter(card, grade, now);
        const nextState = grade === 1 ? (card.state === 'review' || card.state === 'relearning' ? 'relearning' : 'learning') : grade === 2 && card.state !== 'review' ? (card.state === 'relearning' ? 'relearning' : 'learning') : 'review';
        const days = grade === 1 ? 1 / 1440 : grade === 2 && nextState !== 'review' ? 10 / 1440 : intervalFor(mem.stability, retention);
        const updated: MemoryCard = { ...card, ...mem, state: nextState, lastReview: now, reps: card.reps + 1, lapses: card.lapses + (grade === 1 && card.state === 'review' ? 1 : 0), due: now + days * DAY };
        options[grade] = { card: updated, intervalDays: days };
    }
    // Avoid equal rounded intervals on the three successful ratings.
    if (card.state === 'review') {
        options[2].intervalDays = Math.min(options[2].intervalDays, options[3].intervalDays);
        options[3].intervalDays = Math.min(36500, Math.max(options[3].intervalDays, options[2].intervalDays + 1));
    }
    options[4].intervalDays = Math.min(36500, Math.max(options[4].intervalDays, options[3].intervalDays + 1));
    for (const grade of [1, 2, 3, 4] as Grade[])
        options[grade].card.due = now + options[grade].intervalDays * DAY;
    return options;
}
export function dueCards(cards: Record<string, MemoryCard>, now = Date.now()): MemoryCard[] { return Object.values(cards).filter(c => !c.paused && c.due <= now).sort((a, b) => a.due - b.due || a.createdAt - b.createdAt); }
export function intervalLabel(days: number): string { if (days < 1 / 24)
    return `${Math.max(1, Math.round(days * 1440))} 分钟`; if (days < 1)
    return `${Math.round(days * 24)} 小时`; if (days >= 365)
    return `${(days / 365).toFixed(1)} 年`; return `${Math.round(days)} 天`; }
export function localDay(at: number): string { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
