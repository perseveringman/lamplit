import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { Icon } from './Icon';
import { useCorpus } from '../lib/data';
import { useNavigation } from '../lib/navigation';
import { searchCatalog } from '../lib/search';
import type { SearchResult } from '../lib/search';
import type { SentenceSummary } from '../lib/types';
import { TYPE_LABEL } from '../lib/types';
import { lessonFromSentence } from '../lib/utils';
export function SearchDialog({ open, onClose }: {
    open: boolean;
    onClose: () => void;
}) {
    const c = useCorpus(), nav = useNavigation();
    const [query, setQuery] = useState(''), [sentences, setSentences] = useState<SentenceSummary[]>([]), [active, setActive] = useState(0), [scope, setScope] = useState<'all' | 'kp' | 'lesson' | 'sentence'>('all');
    const input = useRef<HTMLInputElement>(null);
    const [error, setError] = useState(false);
    useEffect(() => { if (open) {
        const timer = setTimeout(() => input.current?.focus(), 30);
        c.sentences().then(setSentences).catch(() => setError(true));
        return () => clearTimeout(timer);
    } }, [open, c]);
    const results = useMemo(() => searchCatalog(c.catalog, sentences, query, 24, scope), [c, sentences, query, scope]);
    useEffect(() => setActive(0), [query, scope]);
    useEffect(() => { document.getElementById('search-result-' + active)?.scrollIntoView({ block: 'nearest' }); }, [active]);
    function select(r: SearchResult) { onClose(); if (r.kind === 'kp')
        nav.navigate('atlas', r.id, window.innerWidth < 640 ? { detail: '1' } : {});
    else if (r.kind === 'sentence')
        nav.read(lessonFromSentence(r.id), r.id);
    else
        nav.openEntity({ kind: 'lesson', id: r.id }); }
    const presets = ['一般过去时', '礼貌求助', 'in the end', '私人谈话'];
    return <Dialog open={open} onClose={onClose} title="寻找一个表达，一篇课文" className="search-dialog"><div className="search-input-wrap"><Icon name="search"/><Input ref={input} autoFocus value={query} placeholder="搜索中文知识点、英文表达或课文…" aria-label="搜索知识点、句子、课文" role="combobox" aria-expanded={results.length > 0} aria-controls="search-results" aria-activedescendant={results.length ? 'search-result-' + active : undefined} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(i => Math.min(results.length - 1, i + 1));
    } if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(i => Math.max(0, i - 1));
    } if (e.key === 'Enter' && results[active]) {
        e.preventDefault();
        select(results[active]);
    } }}/></div>
 <div className="search-scopes segmented">{[['all', '全部'], ['kp', '知识点'], ['lesson', '课文'], ['sentence', '原句']].map(([key, label]) => <button className={scope === key ? 'active' : ''} onClick={() => setScope(key as typeof scope)} key={key}>{label}</button>)}</div>
 {!query && <div className="search-start"><span className="eyebrow">从熟悉的开始</span><div className="pill-flow">{presets.map(x => <button className="search-preset" onClick={() => setQuery(x)} key={x}><Icon name="search" size={14}/>{x}</button>)}</div><p>也可以搜索一句课文中的片段。</p></div>}
 <div id="search-results" role="listbox" aria-label="搜索结果" className="search-results">{results.map((r, i) => <button id={'search-result-' + i} role="option" aria-selected={i === active} className={i === active ? 'active' : ''} onMouseEnter={() => setActive(i)} onClick={() => select(r)} key={r.kind + r.id}><span className={'result-icon type-' + r.type}><Icon name={r.kind === 'lesson' ? 'book' : r.kind === 'sentence' ? 'list' : 'spark'} size={18}/></span><span><strong>{r.name}</strong><small>{r.subtitle}</small></span><span className="result-type">{r.kind === 'lesson' ? '课文' : r.kind === 'sentence' ? '原句' : TYPE_LABEL[r.type as keyof typeof TYPE_LABEL]}</span><Icon name="return" size={15}/></button>)}</div>
 {query && !results.length && <div className="search-no-results"><p>没有找到“{query}”</p><span>试试更短的词，或只输入英文表达的一部分。</span></div>}
 {error && <p className="small muted">原句索引暂未加载，知识点与课文仍可搜索。</p>}
 <div className="search-hint"><span>↑ ↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span></div>
 </Dialog>;
}
