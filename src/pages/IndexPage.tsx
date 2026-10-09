import React, { useEffect, useMemo, useState } from 'react';
import { useCorpus, useAsync } from '../lib/data';
import { useNavigation } from '../lib/navigation';
import { TYPE_LABEL, TYPE_ORDER } from '../lib/types';
import type { Entity, KPType } from '../lib/types';
import { matchScore } from '../lib/search';
import { BookFilter, EmptyState, EntityActions, ErrorState, Loader, Pagination, TypeBadge } from '../components/Common';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Icon } from '../components/Icon';
export default function IndexPage() {
    const c = useCorpus(), nav = useNavigation();
    const [type, setType] = useState('all'), [sort, setSort] = useState('degree'), [query, setQuery] = useState(''), [book, setBook] = useState(0), [page, setPage] = useState(1);
    
    useEffect(() => setPage(1), [type, sort, query, book]);
    const list = useMemo(() => {
        if (type === 'lesson')
            return c.catalog.lessons.filter(l => (!book || l.book === book) && (!query || matchScore(l.title + ' ' + l.titleZh + ' ' + l.label, l.scene, query) > 0)).map(l => ({ entity: { kind: 'lesson', id: l.id } as Entity, title: l.title, meaning: l.titleZh || l.scene, meta: l.label, number: l.sentenceCount, numberLabel: '句', kind: 'lesson' as const }));
        return c.catalog.kps.filter(k => (type === 'all' || k.type === type) && (!book || k.lessonIds.some(l => c.lessonSummary(l)?.book === book)) && (!query || matchScore(k.name, k.meaning, query) > 0)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'zh') : sort === 'lessons' ? b.lessonIds.length - a.lessonIds.length : sort === 'type' ? TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || b.degree - a.degree : b.degree - a.degree).map(k => ({ entity: { kind: 'kp', id: k.id } as Entity, title: k.name, meaning: k.meaning, meta: k.lessonIds.length + ' 篇课文', number: k.frequency, numberLabel: '次', kind: k.type }));
    }, [c, type, sort, query, book]);
    const filters = [['all', '全部知识'], ...TYPE_ORDER.map(t => [t, TYPE_LABEL[t]]), ['lesson', '课文']];
    return <div className="index-page"><div className="page-heading"><div className="eyebrow">知识索引</div><h1>把零散的遇见，<em>慢慢串起来。</em></h1><p>查一个词、一种表达，或者找到值得再读的句子。</p></div><div className="index-panel"><div className="filter-tabs" aria-label="内容类型">{filters.map(([key, label]) => <button key={key} className={type === key ? 'active' : ''} aria-pressed={type === key} onClick={() => setType(key)}>{label}</button>)}</div><div className="index-toolbar"><div className="search-field"><Icon name="search" size={18}/><Input aria-label="搜索知识索引" placeholder="搜索名称或释义…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <Button variant="ghost" size="icon" aria-label="清空搜索" onClick={() => setQuery('')}><Icon name="close" size={14}/></Button>}</div><select aria-label="知识点排序" value={sort} disabled={type === 'lesson' || ['model', 'complex', 'example'].includes(type)} onChange={e => setSort(e.target.value)}><option value="degree">按关联度</option><option value="lessons">按出现课数</option><option value="name">按名称</option><option value="type">按类型</option></select></div><div className="index-subtoolbar"><BookFilter value={book} onChange={setBook}/><span className="muted small">{list.length.toLocaleString()} 项</span></div>{list.length ? <div className="knowledge-table"><div className="table-head"><span>知识与表达</span><span>出处</span><span>遇见</span><span>留存</span></div>{list.slice((page - 1) * 80, page * 80).map(row => <div className="knowledge-row" key={row.entity.kind + row.entity.id}><button className="knowledge-name" onClick={() => nav.openEntity(row.entity)}><TypeBadge type={row.kind}/><div><strong className={row.entity.kind === 'sentence' ? 'sentence-title' : ''}>{row.title}</strong>{row.meaning && <p>{row.meaning}</p>}</div></button><button className="knowledge-source" onClick={() => nav.openEntity(row.entity)}>{row.meta}</button><span className="knowledge-count mono">{row.number}<small>{row.numberLabel}</small></span><EntityActions entity={row.entity} compact/></div>)}</div> : <EmptyState title="没有找到相符的内容" text="试试更短的词，或换一个筛选条件。" action={<Button variant="outline" onClick={() => { setQuery(''); setBook(0); setType('all'); }}>清空筛选</Button>}/>}<Pagination page={page} pages={Math.ceil(list.length / 80)} total={list.length} onPage={n => { setPage(n); window.scrollTo({ top: 0 }); }}/></div></div>;
}
