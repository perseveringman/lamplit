import type { Flag, KP, Layers, MemoryCard, Sentence } from './types.ts';
export interface Segment {
    text: string;
    start: number;
    end: number;
    kpIds: string[];
    type: string | null;
    emphasis: 'weak' | 'star' | 'selected' | null;
    grammar: boolean;
    chunk: boolean;
    word: boolean;
    connective: boolean;
    learned: boolean;
}
export function highlightSegments(sentence: Sentence, kpMap: Map<string, KP>, layers: Layers, flags: Record<string, Flag>, cards: Record<string, MemoryCard>, selectedKP?: string | null): Segment[] {
    const active = sentence.hits.filter(([id]) => { const kp = kpMap.get(id); const f = flags['kp:' + id]; return !!kp && (id === selectedKP || f?.star || f?.weak || layers[kp.type]); });
    const bounds = new Set([0, sentence.text.length]);
    active.forEach(([, a, b]) => { bounds.add(a); bounds.add(b); });
    if (layers.connective)
        sentence.connectives.forEach(([a, b]) => { bounds.add(a); bounds.add(b); });
    const sorted = [...bounds].filter(x => x >= 0 && x <= sentence.text.length).sort((a, b) => a - b);
    const result: Segment[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i], b = sorted[i + 1];
        if (a === b)
            continue;
        const hits = active.filter(([, start, end]) => start <= a && end >= b);
        hits.sort(([a], [b]) => { const weight = (id: string) => id === selectedKP ? 100 : flags['kp:' + id]?.weak ? 90 : flags['kp:' + id]?.star ? 80 : ({ chunk: 50, pattern: 40, word: 30, grammar: 20 }[kpMap.get(id)!.type]); return weight(b) - weight(a); });
        const ids = [...new Set(hits.map(x => x[0]))];
        const key = ids[0];
        const selected = !!selectedKP && ids.includes(selectedKP);
        const weak = ids.some(id => flags['kp:' + id]?.weak), star = ids.some(id => flags['kp:' + id]?.star);
        const type = key ? kpMap.get(key)!.type : null;
        result.push({ text: sentence.text.slice(a, b), start: a, end: b, kpIds: ids, type, emphasis: weak ? 'weak' : selected ? 'selected' : star ? 'star' : null, grammar: layers.grammar && ids.some(id => kpMap.get(id)?.type === 'grammar'), chunk: layers.chunk && ids.some(id => kpMap.get(id)?.type === 'chunk'), word: layers.word && ids.some(id => kpMap.get(id)?.type === 'word'), connective: layers.connective && sentence.connectives.some(([start, end]) => start <= a && end >= b), learned: ids.some(id => kpMap.get(id)?.type === 'word' && (cards['kp:' + id]?.reps || 0) > 0) });
    }
    return result;
}
