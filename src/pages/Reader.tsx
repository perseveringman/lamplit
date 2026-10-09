import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAsync, useCorpus } from '../lib/data';
import { useStore, swallow } from '../lib/store';
import { useNavigation, NavigationContext } from '../lib/navigation';
import type { Entity, Layers, Sentence, Lesson, KP } from '../lib/types';
import { TYPE_ORDER, TYPE_LABEL } from '../lib/types';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { Icon } from '../components/Icon';
import { EntityDetail, SentenceDetailsBody } from '../components/Details';
import { EntityActions, EmptyState, ErrorState, KPPill, Loader } from '../components/Common';
import { HighlightedText } from '../components/HighlightedText';
import { contextSense } from '../lib/sense';
export default function Reader({ id, params }: {
    id?: string;
    params: URLSearchParams;
}) { const c = useCorpus(), nav = useNavigation(); const lid = id || c.catalog.defaultLesson; const exists = c.lessonSummary(lid); const result = useAsync(() => exists ? c.lesson(lid) : Promise.reject(new Error('没有找到这篇课文。')), [lid]); if (result.loading)
    return <Loader label="翻开课文…"/>; if (result.error)
    return <ErrorState text={result.error} onRetry={result.retry}/>; return result.data ? <ReadingDesk key={lid} lesson={result.data} sid={params.get('s') || undefined} kid={params.get('kp') || undefined} fromReview={params.get('from') === 'review'}/> : null; }
function ReadingDesk({ lesson, sid, kid, fromReview }: {
    lesson: Lesson;
    sid?: string;
    kid?: string;
    fromReview: boolean;
}) {
    const c = useCorpus(), s = useStore(), nav = useNavigation();
    const [selected, setSelected] = useState(sid || s.data.bookmarks[lesson.id] || lesson.sentences[0]?.id), [activeKP, setActiveKP] = useState<string | undefined>(kid), [detail, setDetail] = useState<Entity | null>(null), [sheet, setSheet] = useState(false), [capsules, setCapsules] = useState(false), [layerOpen, setLayerOpen] = useState(false), [expanded, setExpanded] = useState<string[]>([]);
    const [width, setWidth] = useState(window.innerWidth);
    const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
    // 挂载 effect 会排一个 80ms 定时器去定位初始句。如果用户在这 80ms 内点了某一句，
    // 那个定时器会把选中态覆盖回第一句——手机上（加载慢）几乎必然踩中。
    // 用这个标记让定时器在用户已经手动选过之后不再动手。
    const userPicked = useRef(false);
    useEffect(() => { const resize = () => setWidth(window.innerWidth); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
    const locate = useCallback((sentenceId: string, animate = true) => { setSelected(sentenceId); const el = document.getElementById('sentence-' + sentenceId); el?.scrollIntoView({ behavior: animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto', block: 'center' }); swallow(s.readPosition(lesson.id, sentenceId)); }, [lesson.id, s.readPosition]);
    useEffect(() => { userPicked.current = false; const first = kid ? lesson.sentences.find(x => x.hits.some(h => h[0] === kid)) : undefined; const target = sid || first?.id || s.data.bookmarks[lesson.id] || lesson.sentences[0]?.id; setActiveKP(kid); setDetail(null); if (target) {
        const shouldScroll = !!(sid || first?.id || s.data.bookmarks[lesson.id]);
        const timer = setTimeout(() => { if (userPicked.current) return; if (shouldScroll)
            locate(target, false);
        else {
            setSelected(target);
            window.scrollTo({ top: 0 });
            swallow(s.readPosition(lesson.id, target));
        } }, 80);
        return () => clearTimeout(timer);
    } }, [sid, kid, lesson.id]);
    useEffect(() => { const observer = new IntersectionObserver(entries => { const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top); if (visible[0]) {
        clearTimeout(scrollTimer.current);
        const pos = (visible[0].target as HTMLElement).dataset.sid!;
        scrollTimer.current = setTimeout(() => swallow(s.readPosition(lesson.id, pos)), 700);
    } }, { rootMargin: '-12% 0px -58% 0px', threshold: 0 }); document.querySelectorAll('.sentence-row').forEach(el => observer.observe(el)); return () => { observer.disconnect(); clearTimeout(scrollTimer.current); }; }, [lesson.id, s.readPosition]);
    const sentence = lesson.sentences.find(x => x.id === selected) || lesson.sentences[0];
    const index = c.catalog.lessons.findIndex(l => l.id === lesson.id), prev = c.catalog.lessons[index - 1], next = c.catalog.lessons[index + 1];
    const activeHits = activeKP ? lesson.sentences.filter(x => x.hits.some(h => h[0] === activeKP)) : [];
    const hitIndex = activeHits.findIndex(x => x.id === selected);
    const open = (entity: Entity) => { setDetail(entity); if (entity.kind === 'kp') {
        setActiveKP(entity.id);
        const first = lesson.sentences.find(x => x.hits.some(h => h[0] === entity.id));
        if (first)
            locate(first.id);
    } if (width < 1024) {
        setCapsules(false);
        setSheet(true);
    } };
    const chooseKP = (id: string) => { userPicked.current = true; setActiveKP(id); const first = lesson.sentences.find(x => x.hits.some(h => h[0] === id)); if (first)
        locate(first.id); setDetail({ kind: 'kp', id }); if (width < 640)
        setCapsules(false); };
    const left = <div className="reader-capsules"><div className="capsule-head"><span className="eyebrow">本课知识</span><span className="mono">{lesson.kpIds.length}</span></div>{TYPE_ORDER.map(type => { const points = lesson.kpIds.map(id => c.kp(id)).filter((k): k is KP => !!k && k.type === type); if (!points.length)
        return null; return <section className="capsule-group" key={type}><h4><span className={'type-dot type-' + type}/>{TYPE_LABEL[type]}<span className="mono">{points.length}</span></h4><div className="capsule-list">{(expanded.includes(type) ? points : points.slice(0, type === 'word' ? 8 : 7)).map(k => <div className="capsule-item" key={k.id}><KPPill kp={k} selected={activeKP === k.id} onClick={() => chooseKP(k.id)}/><button className={'capsule-star ' + (s.data.flags['kp:' + k.id]?.star ? 'starred' : '')} aria-label={`${s.data.flags['kp:' + k.id]?.star ? '取消重点' : '重点学'} ${k.name}`} onClick={() => swallow(s.star({ kind: 'kp', id: k.id }))}><Icon name="star" size={14}/></button></div>)}</div>{points.length > (type === 'word' ? 8 : 7) && <button className="expand-knowledge" onClick={() => setExpanded(x => x.includes(type) ? x.filter(t => t !== type) : [...x, type])}>{expanded.includes(type) ? '收起' : `再看 ${points.length - (type === 'word' ? 8 : 7)} 个`}<Icon name="chevron" size={13}/></button>}</section>; })}</div>;
    const right = detail ? <><button className="back-to-sentence" onClick={() => setDetail(null)}><Icon name="back" size={15}/>回到当前句</button><EntityDetail entity={detail} onOpen={open} context={{ lessonId: lesson.id, sentenceId: sentence.id, sense: contextSense(lesson, sentence, detail.id) }}/></> : <SentenceDetailsBody sentence={sentence} onOpen={open}/>;
    const readerNav = { ...nav, read: (lid: string, at?: string, kp?: string) => { setSheet(false); setCapsules(false); setDetail(null); nav.read(lid, at, kp); if (lid === lesson.id) {
            setActiveKP(kp);
            if (at && lesson.sentences.some(x => x.id === at))
                setTimeout(() => locate(at), 30);
        } } };
    return <NavigationContext.Provider value={readerNav}><div className="reader-page"><div className="reader-top"><div className="reader-crumb"><button aria-label="回到连学" onClick={() => nav.navigate('learn')}><Icon name="back" size={18}/></button><span className="mono">{lesson.label}</span><span className="reader-top-title">{lesson.title}</span></div><div className="reader-tools">{fromReview && <Button variant="secondary" size="sm" onClick={() => nav.navigate('review')}><Icon name="return" size={15}/>回到复习</Button>}<Button variant="ghost" size="icon" aria-label="上一篇课文" disabled={!prev} onClick={() => prev && nav.read(prev.id)}><Icon name="back"/></Button><Button variant="ghost" size="icon" aria-label="下一篇课文" disabled={!next} onClick={() => next && nav.read(next.id)}><Icon name="arrow"/></Button><span className="tool-divider"/><Button variant={layerOpen ? 'secondary' : 'ghost'} size="sm" aria-expanded={layerOpen} onClick={() => setLayerOpen(!layerOpen)}><Icon name="layers" size={17}/><span>阅读层</span></Button></div></div>
 {layerOpen && <div className="layer-panel"><div className="layer-options">{([['pattern', '范句标记'], ['grammar', '语法'], ['chunk', '语块'], ['word', '词'], ['connective', '衔接'], ['genre', '体裁']] as [
        keyof Layers,
        string
    ][]).map(([key, label]) => <label key={key} className={'layer-switch ' + (s.data.layers[key] ? 'active' : '')}><input type="checkbox" checked={s.data.layers[key]} onChange={e => swallow(s.setLayers({ [key]: e.target.checked }))}/><span>{label}</span><Icon name={s.data.layers[key] ? 'check' : 'plus'} size={14}/></label>)}</div><div className="reader-size"><span>字号</span><Button size="icon" variant="ghost" disabled={s.data.readerSize <= 16} aria-label="缩小阅读字号" onClick={() => swallow(s.setReaderSize(s.data.readerSize - 1))}>A−</Button><Button size="icon" variant="ghost" disabled={s.data.readerSize >= 26} aria-label="放大阅读字号" onClick={() => swallow(s.setReaderSize(s.data.readerSize + 1))}>A+</Button></div></div>}
 <div className="mobile-reading-tools"><Button variant="outline" size="sm" onClick={() => setCapsules(true)}><Icon name="layers" size={16}/>本课知识 <span className="mono">{lesson.kpIds.length}</span></Button><Button variant="ghost" size="sm" onClick={() => { setDetail(null); setSheet(true); }}>当前句<Icon name="chevron" size={15}/></Button></div>
 <div className="reader-grid"><aside className="reader-left">{left}</aside><main className="reading-main"><header className="reading-title"><div className="eyebrow">{c.catalog.books.find(b => b.id === lesson.book)?.en} <span className="mono">/ {String(lesson.no).padStart(2, '0')}</span></div><h1 lang={lesson.book === 4 ? 'zh-CN' : 'en'}>{lesson.title}</h1>{lesson.titleZh && <p className="reading-title-zh">{lesson.titleZh}</p>}{s.data.layers.genre && <div className="genre-ribbon"><span>{lesson.genre}</span><i />{lesson.scene}</div>}<div className="reading-meta"><span>{lesson.wc} 词 · {lesson.sentences.length} 句</span><EntityActions entity={{ kind: 'lesson', id: lesson.id }} compact/></div></header>
 {activeKP && <div className="active-kp-bar"><span className={'type-dot type-' + c.kp(activeKP)?.type}/><button onClick={() => open({ kind: 'kp', id: activeKP })}>{c.kp(activeKP)?.name}</button><span className="mono">{activeHits.length} 句</span>{activeHits.length > 1 && <><Button variant="ghost" size="icon" aria-label="上一个知识点出现位置" onClick={() => locate(activeHits[(hitIndex - 1 + activeHits.length) % activeHits.length].id)}><Icon name="back" size={14}/></Button><Button variant="ghost" size="icon" aria-label="下一个知识点出现位置" onClick={() => locate(activeHits[(hitIndex + 1) % activeHits.length].id)}><Icon name="arrow" size={14}/></Button></>}<Button variant="ghost" size="icon" aria-label="取消知识点定位" onClick={() => setActiveKP(undefined)}><Icon name="close" size={14}/></Button></div>}
 <div className="reading-text" style={{ '--reading-size': s.data.readerSize + 'px' } as React.CSSProperties}>{lesson.sentences.map((x, i) => <div key={x.id} id={'sentence-' + x.id} data-sid={x.id} className={cn('sentence-row', selected === x.id && 'current', activeKP && x.hits.some(h => h[0] === activeKP) && 'kp-located')} role="group" aria-label={`第 ${i + 1} 句`}><button className="sentence-number mono" aria-label={`查看第 ${i + 1} 句详情`} onClick={() => { userPicked.current = true; setSelected(x.id); setDetail(null); swallow(s.readPosition(lesson.id, x.id)); if (width < 1024)
        setSheet(true); }}>{String(i + 1).padStart(2, '0')}</button><p lang="en" tabIndex={0} role="button" aria-label={`阅读第 ${i + 1} 句`} onClick={() => { setSelected(x.id); setDetail(null); swallow(s.readPosition(lesson.id, x.id)); if (width < 1024)
        setSheet(true); }} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setSelected(x.id);
        setDetail(null);
        if (width < 1024)
            setSheet(true);
    } }}><HighlightedText sentence={x} selectedKP={activeKP} onKP={id => { setSelected(x.id); setActiveKP(id); setDetail({ kind: 'kp', id }); swallow(s.readPosition(lesson.id, x.id)); if (width < 1024)
        setSheet(true); }}/></p></div>)}</div>
 <div className="reading-end"><span className="ornament">✧</span><h3>把这一课，留在自己的节奏里。</h3><p>{next ? '继续下一篇，或者回看刚刚留下的卡片。' : '你已经读到这份语料的最后一篇。'}</p><div>{next && <Button onClick={() => nav.openEntity({ kind: 'lesson', id: next.id })}>下一篇 · {next.label}<Icon name="arrow" size={16}/></Button>}<Button variant="outline" onClick={() => nav.navigate('cards')}>我的卡片</Button></div></div>
 <details className="source-note reader-source"><summary>原文与收录说明</summary><p>正文按上传文件保留，历史观点和数据属于课文语境；阅读主题、能力路径与学习提示由本项目整理。</p>{lesson.quality.map((q, i) => <p key={i}>{q}</p>)}<p>原文件标题：{lesson.sourceHeading}</p><p className="mono">{lesson.sourceFile} · 第 {lesson.sourceLine}–{lesson.sourceEndLine} 行</p></details></main>
 <aside className="reader-right paper">{right}</aside></div>
 <Dialog open={capsules && width < 640} onClose={() => setCapsules(false)} title="本课知识" sheet className="capsule-sheet">{left}</Dialog><Dialog open={sheet && width < 1024} onClose={() => setSheet(false)} title="阅读详情" sheet className="reader-detail-sheet paper">{right}</Dialog>
 </div></NavigationContext.Provider>;
}
