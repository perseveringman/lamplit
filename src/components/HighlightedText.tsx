import React, { useMemo } from 'react';
import { useCorpus } from '../lib/data';
import { useStore } from '../lib/store';
import { highlightSegments } from '../lib/highlight';
import { cn } from '../lib/utils';
import type { Sentence } from '../lib/types';
export function HighlightedText({ sentence, selectedKP, inert = false, onKP }: {
    sentence: Sentence;
    selectedKP?: string | null;
    inert?: boolean;
    onKP?: (id: string) => void;
}) {
    const corpus = useCorpus(), { data } = useStore();
    const segments = useMemo(() => highlightSegments(sentence, corpus.kpMap, data.layers, data.flags, data.cards, selectedKP), [sentence, corpus, data.layers, data.flags, data.cards, selectedKP]);
    return <>{segments.map(s => { const classes = cn(s.kpIds.length > 0 && 'hl', s.grammar && 'hl-grammar', s.chunk && 'hl-chunk', s.word && 'hl-word', s.learned && 'hl-learned', s.connective && 'hl-connective', s.emphasis && `hl-${s.emphasis}`); if (s.kpIds.length && !inert)
        return <span key={s.start} className={classes} role="button" tabIndex={0} data-kp={s.kpIds[0]} data-layer={s.type || ''} aria-label={`${s.text}：${corpus.kp(s.kpIds[0])?.name}`} onClick={e => { e.stopPropagation(); onKP?.(s.kpIds[0]); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onKP?.(s.kpIds[0]);
        } }}>{s.text}</span>; return <span key={s.start} className={classes}>{s.text}</span>; })}</>;
}
