import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Corpus, CorpusContext, loadJSON } from './lib/data';
import type { Catalog, Entity } from './lib/types';
import { StoreProvider, useStore, swallow } from './lib/store';
import { NavigationContext } from './lib/navigation';
import { useRoute, go } from './lib/router';
import { dueCards } from './lib/fsrs';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';
import { Icon } from './components/Icon';
import type { IconName } from './components/Icon';
import { EmptyState, ErrorState, Loader } from './components/Common';
import { EntityDetail } from './components/Details';
import { SearchDialog } from './components/SearchDialog';
const Today = lazy(() => import('./pages/Today')), Quiz = lazy(() => import('./pages/Quiz')), Atlas = lazy(() => import('./pages/Atlas')), Learn = lazy(() => import('./pages/Learn')), IndexPage = lazy(() => import('./pages/IndexPage')), Connections = lazy(() => import('./pages/Connections')), Reader = lazy(() => import('./pages/Reader')), Cards = lazy(() => import('./pages/Cards')), Review = lazy(() => import('./pages/Review'));
const ShadowLanguage = lazy(() => import('./pages/ShadowLanguage'));
// 二级入口：星图 / 索引 / 共点 / 精读 不再是 tab，但仍可从今日页或搜索进入。
const SECONDARY_LABEL: Record<string, string> = { atlas: '知识星图', index: '知识索引', connections: '课文共点', read: '阅读工作台', review: '复习', quiz: '收尾测验' };
export default function App() { const [corpus, setCorpus] = useState<Corpus | null>(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0); useEffect(() => { let live = true; setError(''); loadJSON<Catalog>('catalog.json').then(d => { if (live)
    setCorpus(new Corpus(d)); }).catch(e => { if (live)
    setError(e instanceof Error ? e.message : '内容加载失败'); }); return () => { live = false; }; }, [attempt]); if (error)
    return <div className="boot-screen"><ErrorState text={error} onRetry={() => setAttempt(a => a + 1)}/></div>; if (!corpus)
    return <div className="boot-screen"><div className="boot-brand">✧<span>灯下</span></div><Loader label="正在翻开你的阅读星图…"/></div>; return <CorpusContext.Provider value={corpus}><StoreProvider><Shell corpus={corpus}/></StoreProvider></CorpusContext.Provider>; }
function Shell({ corpus: c }: {
    corpus: Corpus;
}) {
    const route = useRoute(), store = useStore();
    const [selected, setSelected] = useState<Entity | null>(null), [search, setSearch] = useState(false), [help, setHelp] = useState(false), [now, setNow] = useState(Date.now());
    const [detailHistory, setDetailHistory] = useState<Entity[]>([]);
    const reader = route.view === 'read', review = route.view === 'review';
    const due = dueCards(store.data.cards, Math.max(now, Date.now())).length;
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);
    const openEntity = useCallback((entity: Entity) => { setSearch(false); if (selected && selected.id !== entity.id)
        setDetailHistory(x => [...x.slice(-8), selected]); setSelected(entity); }, [selected]);
    const navigate = useCallback((view: string, id = '', params: Record<string, string | undefined> = {}) => { setSelected(null); setDetailHistory([]); setSearch(false); go(view, id, params); if (view === 'atlas' && params.detail === '1')
        setSelected({ kind: 'kp', id }); }, []);
    const read = useCallback((lessonId: string, sentenceId?: string, kpId?: string) => { navigate('read', lessonId, { s: sentenceId, kp: kpId, from: route.view === 'review' || route.params.get('from') === 'review' ? 'review' : undefined }); }, [navigate, route.key]);
    const nav = useMemo(() => ({ openEntity, navigate, read }), [openEntity, navigate, read]);
    useEffect(() => { setSelected(route.view === 'atlas' && route.params.get('detail') === '1' ? { kind: 'kp', id: route.id } : null); setDetailHistory([]); setSearch(false); window.scrollTo({ top: 0 }); document.title = route.view === 'read' ? `${c.lessonSummary(route.id)?.title || '精读'} · 灯下` : route.view === 'shadow-language' ? 'Shadow Language · 灯下' : '灯下 · 阅读星图'; }, [route.key, c]);
    useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSelected(null);
        setSearch(x => !x);
    } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
    const navs: {
        view: string;
        label: string;
        short: string;
        icon: IconName;
    }[] = [{ view: 'today', label: '今天', short: '今天', icon: 'sun' }, { view: 'learn', label: '课程', short: '课程', icon: 'route' }, { view: 'index', label: '知识索引', short: '索引', icon: 'list' }, { view: 'cards', label: '我的卡片', short: '卡片', icon: 'cards' }, { view: 'shadow-language', label: 'Shadow Language', short: 'Shadow', icon: 'spark' }];
    const page = route.view === 'today' ? <Today/> : route.view === 'quiz' ? <Quiz id={route.id}/> : route.view === 'atlas' ? <Atlas id={route.id}/> : route.view === 'index' ? <IndexPage /> : route.view === 'learn' ? <Learn id={route.id}/> : route.view === 'connections' ? <Connections /> : reader ? <Reader id={route.id} params={route.params}/> : route.view === 'cards' ? <Cards /> : route.view === 'shadow-language' ? <ShadowLanguage /> : review ? <Review /> : <EmptyState title="这一页暂时没有内容" action={<Button onClick={() => navigate('today')}>回到今天</Button>}/>;
    return <NavigationContext.Provider value={nav}><div className={'app-shell ' + (reader ? 'reading-shell' : '') + (review ? ' review-shell' : '')}><a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>跳到主要内容</a>
 <aside className="app-sidebar"><button className="brand" onClick={() => navigate('today')} aria-label="灯下，返回今天"><span className="brand-symbol">✧</span><span className="brand-name">灯下<small>READING ATLAS</small></span></button><div className="nav-label">你的阅读空间</div><nav aria-label="主要导航">{navs.map(n => <button key={n.view} className={route.view === n.view || (n.view === 'cards' && review) ? 'active' : ''} aria-current={route.view === n.view ? 'page' : undefined} title={n.label} onClick={() => n.view === 'read' ? read(store.data.reading?.lessonId || c.catalog.defaultLesson, store.data.reading?.sentenceId) : navigate(n.view, n.view === 'atlas' ? c.catalog.defaultKP : undefined)}><Icon name={n.icon} size={20}/><span className="nav-desktop-label">{n.label}</span><span className="nav-mobile-label">{n.short}</span>{n.view === 'cards' && due > 0 && <span className="nav-due">{due > 99 ? '99+' : due}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-quote"><span>“</span><p>在语境中相遇，<br />在理解中记住。</p><i /></div><button className="help-button" onClick={() => setHelp(true)} title="怎样开始"><Icon name="help" size={18}/><span>怎样开始</span></button><div className="local-indicator"><span className="status-dot"/>本地阅读空间</div></div></aside>
 <div className="app-body"><header className="app-header"><div className="header-location"><span className="mobile-brand">✧ 灯下</span><span className="desktop-breadcrumb">新概念英语 <span>/</span> {navs.find(n => n.view === route.view)?.label || SECONDARY_LABEL[route.view] || '回看'}</span></div><button className="global-search" onClick={() => { setSelected(null); setSearch(true); }} aria-label="打开全局搜索"><Icon name="search" size={17}/><span>找一个表达、一篇课文</span><kbd>⌘ K</kbd></button><div className="header-actions">{due > 0 ? <button className="due-hint" onClick={() => navigate('cards')}><span className="status-dot"/>{due} 张待复习</button> : <span className="header-subtle">慢慢读，深深懂。</span>}<Button variant="ghost" size="icon" aria-label="学习使用帮助" onClick={() => setHelp(true)}><Icon name="help" size={19}/></Button></div></header>
 {store.storageError && <div className="storage-warning" role="alert"><Icon name="warning" size={17}/>{store.storageError} 当前仍可阅读，但标记不能保存。</div>}
 <main id="main-content" tabIndex={-1} className={'main-content ' + (reader ? 'main-reader' : '') + (review ? ' main-review' : '')}><Suspense fallback={<Loader />}>{store.ready ? page : <Loader label="读取你的阅读位置…"/>}</Suspense></main></div>
 <Dialog open={selected !== null} onClose={() => { setSelected(null); setDetailHistory([]); }} title="知识与语境" sheet className="paper entity-sheet">{selected && <>{detailHistory.length > 0 && <Button variant="ghost" size="sm" onClick={() => { const previous = detailHistory.at(-1)!; setDetailHistory(x => x.slice(0, -1)); setSelected(previous); }}><Icon name="back" size={15}/>上一个</Button>}<EntityDetail entity={selected}/></>}</Dialog>
 <SearchDialog open={search} onClose={() => setSearch(false)}/>
 <Dialog open={help} onClose={() => setHelp(false)} title="从一篇课文开始" description="不用先看懂整张星图。先读一篇，再让知识慢慢连起来。"><div className="help-steps"><section><span>01</span><div><h3>先选一个想表达的事</h3><p>在「连学」里选择能力路径，点开课文，看看这一课会练习什么。</p></div></section><section><span>02</span><div><h3>在原句中读懂</h3><p>点击句子看详情。点左侧知识胶囊，可以找到它在文中的所有出现处。紫色实线标记范句，橙色虚线提示长难句。</p></div></section><section><span>03</span><div><h3>只留下对你有用的</h3><p>星标会自动保存卡片；「不熟悉」标记会让表达更醒目。到「我的卡片」翻面回看，再按真实回忆情况评分。</p></div></section></div><div className="help-shortcuts"><span><kbd>⌘ / Ctrl K</kbd> 全局搜索</span><span><kbd>Space</kbd> 翻面</span><span><kbd>1–4</kbd> 复习评分</span></div><p className="small muted">所有记录只保存在当前浏览器。没有账号，也不会自动跨设备同步。</p><Button className="full" onClick={() => { setHelp(false); openEntity({ kind: 'lesson', id: c.catalog.defaultLesson }); }}>从这一课开始<Icon name="arrow" size={17}/></Button></Dialog>
 <div className="toast-region" role="status" aria-live="polite">{store.toasts.map(t => <div className={'toast ' + (t.error ? 'error' : '')} key={t.id}><Icon name={t.error ? 'warning' : 'check'} size={17}/>{t.text}</div>)}</div>
 </div></NavigationContext.Provider>;
}
