import type { Catalog, Entity, SentenceSummary } from './types.ts';
export interface SearchResult extends Entity {
    name: string;
    subtitle: string;
    type: string;
    score: number;
    book?: number;
}
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
export function matchScore(name: string, meaning: string, query: string): number {
    const n = normalize(name), q = normalize(query), m = normalize(meaning);
    if (!q)
        return 0;
    if (n === q)
        return 100;
    if (n.startsWith(q))
        return 80;
    if (n.includes(q))
        return 60;
    if (m.includes(q))
        return 40;
    const parts = q.split(' ').filter(Boolean);
    if (parts.length > 1 && parts.every(p => n.includes(p)))
        return 30;
    // Single omitted/extra character, restricted to short Latin headwords.
    if (/^[a-z]{4,18}$/.test(q) && /^[a-z-]{3,19}$/.test(n) && Math.abs(n.length - q.length) <= 1) {
        let a = 0, b = 0, diff = 0;
        while (a < n.length && b < q.length) {
            if (n[a] === q[b]) {
                a++;
                b++;
                continue;
            }
            if (++diff > 1)
                return 0;
            if (n.length >= q.length)
                a++;
            if (n.length <= q.length)
                b++;
        }
        if (diff + n.length - a + q.length - b <= 1)
            return 20;
    }
    return 0;
}
export function searchCatalog(catalog: Catalog, sentences: SentenceSummary[], query: string, limit = 30, scope: 'all' | 'kp' | 'lesson' | 'sentence' = 'all'): SearchResult[] {
    const out: SearchResult[] = [];
    if (!query.trim())
        return out;
    if (scope === 'all' || scope === 'kp')
        for (const k of catalog.kps) {
            const score = matchScore(k.name, k.meaning, query);
            if (score)
                out.push({ kind: 'kp', id: k.id, name: k.name, subtitle: k.meaning || `${k.lessonIds.length} 篇课文中的用法`, type: k.type, score });
        }
    if (scope === 'all' || scope === 'lesson')
        for (const l of catalog.lessons) {
            const score = matchScore(l.title, `${l.titleZh} ${l.scene} ${l.canDo} ${l.label} 第${l.book}册 第${l.no}课 Lesson ${l.no}`, query);
            if (score)
                out.push({ kind: 'lesson', id: l.id, name: l.title, subtitle: `${l.label} · ${l.scene}`, book: l.book, type: 'lesson', score });
        }
    if (scope === 'all' || scope === 'sentence')
        for (const s of sentences) {
            const score = matchScore(s.text, '', query);
            if (score)
                out.push({ kind: 'sentence', id: s.id, name: s.text, subtitle: s.tier === 'model' ? '范句' : s.tier === 'complex' ? '长难句' : '原文例句', type: 'sentence', score: score === 100 ? 100 : score - 5 });
        }
    return out.sort((a, b) => b.score - a.score || ({ kp: 0, lesson: 1, sentence: 2 }[a.kind] - { kp: 0, lesson: 1, sentence: 2 }[b.kind]) || a.name.length - b.name.length).slice(0, limit);
}
