import React, { useEffect, useMemo, useState } from 'react';
import { useCorpus } from '../lib/data';
import { useNavigation } from '../lib/navigation';
import { BookFilter, EmptyState, LessonCard, Pagination } from '../components/Common';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui/button';
export default function Learn({ id }: {
    id?: string;
}) {
    const c = useCorpus(), nav = useNavigation();
    const [book, setBook] = useState(0), [page, setPage] = useState(1);
    const cluster = c.catalog.clusters.find(x => x.id === id);
    const selected = id && cluster ? cluster.id : 'all';
    useEffect(() => { setPage(1); }, [book, id]);
    const stages = ['生存', '日常', '叙事', '读写', '思辨'];
    const sorted = [...c.catalog.clusters].sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage) || b.lessonIds.length - a.lessonIds.length);
    const lessons = c.catalog.lessons.filter(l => (selected === 'all' || cluster!.lessonIds.includes(l.id)) && (!book || l.book === book));
    return <div className="learn-page"><div className="page-heading"><div className="eyebrow">连学 · 选择你的下一段路</div><h1>不只读懂，<em>更能表达。</em></h1><p>选一个你想做到的事，让课文成为一条有方向的路径。</p></div><div className="mobile-path-picker"><label htmlFor="path-select">想练习哪一种表达？</label><select id="path-select" value={selected} onChange={e => nav.navigate("learn", e.target.value === "all" ? undefined : e.target.value)}><option value="all">全部课文 · 288 篇</option>{stages.map(stage => <optgroup label={stage} key={stage}>{sorted.filter(cl => cl.stage === stage).map(cl => <option value={cl.id} key={cl.id}>{cl.name} · {cl.lessonIds.length} 篇</option>)}</optgroup>)}</select></div><div className="learn-layout"><aside className="path-sidebar"><button className={'path-all ' + (selected === 'all' ? 'active' : '')} onClick={() => nav.navigate('learn')}><Icon name="book" size={18}/>全部课文<span className="mono">288</span></button>{stages.map(stage => <section key={stage}><h4>{stage}</h4>{sorted.filter(cl => cl.stage === stage).map(cl => <button className={'path-item ' + (selected === cl.id ? 'active' : '')} key={cl.id} onClick={() => nav.navigate('learn', cl.id)}><span>{cl.name}</span><small>{cl.lessonIds.length}</small></button>)}</section>)}</aside><main className="path-content"><div className="path-intro"><div><span className="eyebrow">{cluster ? cluster.stage + ' · 能力路径' : '四册 · 原文顺序'}</span><h2>{cluster?.name || '从感兴趣的一课开始'}</h2><p>{cluster?.description || '第一册到第四册，由日常对话走向更丰富的表达。'}</p></div><span className="path-count">{lessons.length}<small>篇课文</small></span></div><BookFilter value={book} onChange={setBook}/>{lessons.length ? <div className="lesson-grid">{lessons.slice((page - 1) * 12, page * 12).map((l, i) => <LessonCard key={l.id} lesson={l} sequence={selected === 'all' ? undefined : (page - 1) * 12 + i} onLesson={id => nav.openEntity({ kind: 'lesson', id })} onKP={id => nav.openEntity({ kind: 'kp', id })}/>)}</div> : <EmptyState title="这册还没有对应课文" text="换一册，或看看这条路径的全部课文。" action={<Button onClick={() => setBook(0)}>查看全部</Button>}/>}<Pagination page={page} pages={Math.ceil(lessons.length / 12)} total={lessons.length} onPage={n => { setPage(n); document.querySelector('.path-content')?.scrollIntoView({ block: 'start' }); }}/></main></div></div>;
}
