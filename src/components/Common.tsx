import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Icon } from './Icon';
import { useStore, swallow } from '../lib/store';
import { useCorpus } from '../lib/data';
import { entityKey, TYPE_LABEL, TYPE_ORDER } from '../lib/types';
import type { Entity, KP, LessonSummary } from '../lib/types';
import { cn, readingTime } from '../lib/utils';
export function Loader({ label = '正在展开内容…' }: {
    label?: string;
}) { return <div className="loading-state" role="status"><span className="spinner"/><span>{label}</span></div>; }
export function ErrorState({ text, onRetry }: {
    text: string;
    onRetry?: () => void;
}) { return <div className="empty-state"><Icon name="warning" size={28}/><h3>{text}</h3>{onRetry && <Button variant="outline" onClick={onRetry}>重新加载</Button>}</div>; }
export function EmptyState({ title, text, action }: {
    title: string;
    text?: string;
    action?: React.ReactNode;
}) { return <div className="empty-state"><div className="empty-orbit"><Icon name="spark" size={32}/></div><h3>{title}</h3>{text && <p>{text}</p>}{action}</div>; }
export function KPPill({ kp, onClick, selected = false, compact = false }: {
    kp: KP;
    onClick: () => void;
    selected?: boolean;
    compact?: boolean;
}) { const { data } = useStore(); const f = data.flags['kp:' + kp.id]; return <button className={cn('kp-pill', `type-${kp.type}`, selected && 'selected', compact && 'compact', f?.weak && 'is-weak', f?.star && 'is-star')} onClick={onClick} title={kp.meaning || kp.name}><span className="type-dot"/>{kp.name}{f?.star && <Icon name="star" size={12}/>}</button>; }
export function TypeBadge({ type }: {
    type: KP['type'] | 'sentence' | 'lesson';
}) { return <Badge className={cn('type-badge', `type-${type}`)}><span className="type-dot"/>{type === 'sentence' ? '句子' : type === 'lesson' ? '课文' : TYPE_LABEL[type]}</Badge>; }
export function EntityActions({ entity, compact = false }: {
    entity: Entity;
    compact?: boolean;
}) {
    const s = useStore();
    const key = entityKey(entity), flags = s.data.flags[key];
    const saved = !!s.data.cards[key];
    return <div className={cn('entity-actions', compact && 'compact')} onClick={e => e.stopPropagation()}>
 <Button variant="ghost" size="icon" className={flags?.star ? 'starred' : ''} aria-label={flags?.star ? '取消重点' : '重点学'} title="重点学，同时保存为卡片" aria-pressed={!!flags?.star} onClick={() => swallow(s.star(entity))}><Icon name="star"/></Button>
 {!compact && <Button variant="ghost" size="icon" className={flags?.weak ? 'weakened' : ''} aria-label={flags?.weak ? '取消不熟悉' : '不熟悉'} title="标记为不熟悉" aria-pressed={!!flags?.weak} onClick={() => swallow(s.weak(entity))}><Icon name="warning"/></Button>}
 <Button variant={compact ? 'ghost' : 'outline'} size={compact ? 'icon' : 'sm'} aria-label={saved ? '已保存为知识卡片' : '保存为知识卡片'} disabled={saved} onClick={() => swallow(s.save(entity))}><Icon name={saved ? 'check' : 'bookmark'} size={17}/>{!compact && (saved ? '已保存' : '保存卡片')}</Button>
 </div>;
}
export function LessonCard({ lesson, onLesson, onKP, sequence }: {
    lesson: LessonSummary;
    onLesson: (id: string) => void;
    onKP: (id: string) => void;
    sequence?: number;
}) {
    const corpus = useCorpus(), store = useStore();
    // 进度来自 E 组的 lessons 记录。用累计可见句数而不是"读到第几句"——
    // 读者会回看、会跳读，只记最后一句会低估覆盖。
    const prog = store.data.lessons?.[lesson.id];
    const visited = Math.min(prog?.visited?.length || 0, lesson.sentenceCount || 0);
    const pct = lesson.sentenceCount ? Math.round((100 * visited) / lesson.sentenceCount) : 0;
    return <article className={cn('lesson-card', 'book-' + lesson.book, prog && 'has-progress')}>
 <div className="lesson-card-meta"><span className="mono">{sequence !== undefined && <span className="route-number">{String(sequence + 1).padStart(2, '0')}</span>}{lesson.label}</span><span>{lesson.genre}</span><EntityActions entity={{ kind: 'lesson', id: lesson.id }} compact/></div>
 <button className="lesson-card-main" onClick={() => onLesson(lesson.id)}><h3>{lesson.title}</h3>{lesson.titleZh && <p className="lesson-zh">{lesson.titleZh}</p>}<p className="lesson-scene">{lesson.scene}</p><p className="lesson-can-do">{lesson.canDo}</p></button>
 <div className="lesson-card-pills">{lesson.focus.slice(0, 4).map(id => corpus.kp(id)).filter((k): k is KP => !!k).map(k => <KPPill key={k.id} kp={k} onClick={() => onKP(k.id)} compact/>)}</div>
 {visited > 0 && <div className="lesson-card-progress" title={`已读 ${visited} / ${lesson.sentenceCount} 句`}><i style={{ width: pct + '%' }}/></div>}
 <div className="lesson-card-footer"><span><Icon name="clock" size={14}/>{visited > 0 ? `${visited}/${lesson.sentenceCount} 句 · ` : ''}{readingTime(lesson.wc)} 分钟 · {lesson.wc} 词</span><button onClick={() => onLesson(lesson.id)}>{prog ? '继续这一课' : '看看这一课'}<Icon name="arrow" size={16}/></button></div>
 </article>;
}
export function Pagination({ page, pages, onPage, total }: {
    page: number;
    pages: number;
    onPage: (n: number) => void;
    total?: number;
}) { if (pages <= 1)
    return null; return <div className="pagination">{total !== undefined && <span className="muted">共 {total.toLocaleString('zh-CN')} 项</span>}<div><Button variant="ghost" size="icon" aria-label="上一页" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon name="back"/></Button><span className="mono">{page} / {pages}</span><Button variant="ghost" size="icon" aria-label="下一页" disabled={page >= pages} onClick={() => onPage(page + 1)}><Icon name="arrow"/></Button></div></div>; }
export function BookFilter({ value, onChange }: {
    value: number;
    onChange: (n: number) => void;
}) { const c = useCorpus(); return <div className="segmented book-filter" aria-label="按册选择"><button aria-pressed={value === 0} className={value === 0 ? 'active' : ''} onClick={() => onChange(0)}>全部</button>{c.catalog.books.map(b => <button aria-pressed={value === b.id} className={value === b.id ? 'active' : ''} key={b.id} onClick={() => onChange(b.id)}>{b.name}</button>)}</div>; }
export function KPGroup({ ids, onKP, max = 8 }: {
    ids: string[];
    onKP: (id: string) => void;
    max?: number;
}) { const c = useCorpus(); const [expanded, setExpanded] = useState(false); const filtered = ids.map(id => c.kp(id)).filter((k): k is KP => !!k); return <>{TYPE_ORDER.map(type => { const points = filtered.filter(k => k.type === type); if (!points.length)
    return null; return <section className="kp-group" key={type}><h4><TypeBadge type={type}/><span className="mono">{points.length}</span></h4><div className="pill-flow">{(expanded ? points : points.slice(0, max)).map(k => <KPPill kp={k} key={k.id} onClick={() => onKP(k.id)}/>)}</div></section>; })}{!expanded && filtered.some(k => filtered.filter(x => x.type === k.type).length > max) && <Button variant="ghost" onClick={() => setExpanded(true)}>展开所有知识点<Icon name="plus" size={16}/></Button>}</>; }
