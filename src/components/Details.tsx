import React, { useEffect, useMemo, useState } from 'react';
import { useAsync, useCorpus } from '../lib/data';
import { useStore } from '../lib/store';
import { useNavigation } from '../lib/navigation';
import { TYPE_LABEL, TIER_LABEL, TYPE_ORDER } from '../lib/types';
import type { Entity, KP, LessonSummary, Sentence } from '../lib/types';
import { readingTime, cn } from '../lib/utils';
import { Button } from './ui/button';
import { Icon } from './Icon';
import { EntityActions, ErrorState, KPGroup, KPPill, Loader, Pagination, TypeBadge } from './Common';
import { HighlightedText } from './HighlightedText';
export function EntityDetail({ entity, onOpen, context }: {
    entity: Entity;
    onOpen?: (e: Entity) => void;
    context?: {
        lessonId: string;
        sentenceId: string;
    };
}) { if (entity.kind === 'kp')
    return <KPDetail key={entity.id} id={entity.id} onOpen={onOpen} context={context}/>; if (entity.kind === 'lesson')
    return <LessonDetail key={entity.id} id={entity.id} onOpen={onOpen}/>; return <SentenceDetail key={entity.id} id={entity.id} onOpen={onOpen}/>; }
function UseQuote({ kp, context }: {
    kp: KP;
    context?: {
        lessonId: string;
        sentenceId: string;
    };
}) {
    const c = useCorpus(), nav = useNavigation();
    const lid = context && kp.lessonIds.includes(context.lessonId) ? context.lessonId : kp.lessonIds.includes(c.catalog.defaultLesson) ? c.catalog.defaultLesson : kp.lessonIds[0];
    const { data: lesson, loading, error, retry } = useAsync(() => c.lesson(lid), [lid]);
    if (loading)
        return <div className="quote-skeleton"/>;
    if (error)
        return <ErrorState text={error} onRetry={retry}/>;
    const sentence = lesson?.sentences.find(s => s.id === context?.sentenceId && s.hits.some(([id]) => id === kp.id)) || lesson?.sentences.find(s => s.hits.some(([id]) => id === kp.id));
    if (!sentence)
        return null;
    return <div className="evidence-quote"><span className="quote-mark">“</span><p lang="en"><HighlightedText sentence={sentence} selectedKP={kp.id} inert/></p><button className="source-link" onClick={() => nav.read(lid, sentence.id, kp.id)}>{lesson?.label} · {lesson?.title}<Icon name="arrow" size={14}/></button></div>;
}
function ContextExamples({ kp }: {
    kp: KP;
}) {
    const c = useCorpus(), nav = useNavigation();
    const [page, setPage] = useState(1);
    const refs = useAsync(() => c.occurrences(kp.id), [kp.id]);
    const ids = useMemo(() => [...new Set((refs.data || []).map(x => x[0]))], [refs.data]);
    const list = useAsync(() => Promise.all(ids.slice((page - 1) * 5, page * 5).map(id => c.sentence(id))), [ids, page]);
    if (refs.error)
        return <ErrorState text={refs.error} onRetry={refs.retry}/>;
    if (list.error)
        return <ErrorState text={list.error} onRetry={list.retry}/>;
    return <div className="context-list">{refs.loading || list.loading ? <Loader /> : <><p className="muted small">{ids.length} 句原文 · 点击回到对应位置</p>{list.data?.map(s => { const l = c.lessonSummary(s.lessonId); return <button className="context-item" key={s.id} onClick={() => nav.read(s.lessonId, s.id, kp.id)}><span className="mono">{l?.label} · 第 {s.index + 1} 句</span><p lang="en"><HighlightedText sentence={s} selectedKP={kp.id} inert/></p><Icon name="arrow" size={15}/></button>; })}<Pagination page={page} pages={Math.ceil(ids.length / 5)} onPage={setPage}/></>}</div>;
}
function KPDetail({ id, onOpen, context }: {
    id: string;
    onOpen?: (e: Entity) => void;
    context?: {
        lessonId: string;
        sentenceId: string;
    };
}) {
    const c = useCorpus(), nav = useNavigation();
    const kp = c.kp(id);
    const [tab, setTab] = useState('lessons'), [page, setPage] = useState(1);
    const open = onOpen || nav.openEntity;
    if (!kp)
        return <ErrorState text="没有找到这个知识点。"/>;
    const related = [...(kp.parent ? [kp.parent] : []), ...kp.contains, ...kp.related].filter((x, i, a) => x !== id && a.indexOf(x) === i).map(x => c.kp(x)).filter((k): k is KP => !!k).sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
    return <div className="entity-detail kp-detail">
  <div className="detail-kicker"><TypeBadge type={kp.type}/><span className="mono">{kp.lessonIds.length} 篇 · {kp.frequency} 次</span></div>
  <h2 className={kp.type === 'word' || kp.type === 'chunk' ? 'english-heading' : ''}>{kp.name}</h2>
  <p className="detail-meaning">{kp.meaning || '原文没有附带中文释义，可以先比较它在不同句子中的用法。'}</p>
  <EntityActions entity={{ kind: 'kp', id }}/>
  <UseQuote kp={kp} context={context}/>
  <Button className="full" onClick={() => nav.read(context && kp.lessonIds.includes(context.lessonId) ? context.lessonId : kp.lessonIds.includes(c.catalog.defaultLesson) ? c.catalog.defaultLesson : kp.lessonIds[0], context?.sentenceId, kp.id)}>在课文中理解<Icon name="arrow" size={17}/></Button>
  <div className="detail-tabs" role="tablist" aria-label="知识点内容">{[['lessons', '出现课文'], ['contexts', '原句用法'], ['related', '相关知识']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setPage(1); }}>{label}</button>)}</div>
  {tab === 'lessons' && <><div className="related-lessons">{kp.lessonIds.slice((page - 1) * 6, page * 6).map(lid => { const l = c.lessonSummary(lid)!; return <button key={lid} onClick={() => open({ kind: 'lesson', id: lid })}><span className="mono">{l.label}</span><span>{l.title}</span><Icon name="chevron" size={16}/></button>; })}</div><Pagination page={page} pages={Math.ceil(kp.lessonIds.length / 6)} onPage={setPage}/></>}
  {tab === 'contexts' && <ContextExamples kp={kp}/>}
  {tab === 'related' && <><div className="relation-note">{kp.parent && <p>句型从属 <button onClick={() => open({ kind: 'kp', id: kp.parent! })}>{c.kp(kp.parent)?.name}</button></p>}{kp.contains.length > 0 && <p>包含 <span>{kp.contains.length}</span> 个词或相关词形</p>}</div><div className="pill-flow">{related.map(k => <KPPill key={k.id} kp={k} onClick={() => open({ kind: 'kp', id: k.id })}/>)}</div><p className="small muted">关联来自组成关系或同课出现，不表示近义。</p></>}
  <details className="source-note"><summary>注解来源</summary><p>{kp.provenance === 'source-inline' ? '释义来自上传课文中的中文旁注。' : kp.provenance === 'context' ? '原文语境索引，未自动补写释义。' : '释义为本项目整理的学习提示，不是课本原注。'}{kp.type === 'grammar' || kp.type === 'pattern' ? ' 原句命中由规则识别，学习时请结合上下文核对。' : ''}</p></details>
 </div>;
}
function LessonDetail({ id, onOpen }: {
    id: string;
    onOpen?: (e: Entity) => void;
}) {
    const c = useCorpus(), nav = useNavigation(), store = useStore(), lesson = c.lessonSummary(id), open = onOpen || nav.openEntity;
    if (!lesson)
        return <ErrorState text="没有找到这篇课文。"/>;
    const idx = c.catalog.lessons.findIndex(l => l.id === id), prev = c.catalog.lessons[idx - 1], next = c.catalog.lessons[idx + 1];
    return <div className="entity-detail lesson-detail">
  <div className="detail-kicker"><TypeBadge type="lesson"/><span className="mono">{lesson.label}</span></div>
  <h2 className="english-heading" lang={lesson.book === 4 ? 'zh-CN' : 'en'}>{lesson.title}</h2>{lesson.titleZh && <p className="lesson-zh">{lesson.titleZh}</p>}
  <div className="detail-meta"><span>{lesson.genre}</span><span>{lesson.wc} 词</span><span>{readingTime(lesson.wc)} 分钟</span></div>
  <div className="lesson-intention"><span className="eyebrow">这一课，你会练习</span><h3>{lesson.scene}</h3><p>{lesson.canDo}</p></div>
  <Button className="full" size="lg" onClick={() => nav.read(id, store.data.bookmarks[id])}><Icon name="book"/>{store.data.bookmarks[id] ? '继续精读' : '开始精读'}<Icon name="arrow" size={17}/></Button>
  <EntityActions entity={{ kind: 'lesson', id }}/>
  <section className="detail-section"><h4>{lesson.summary ? '课文导读' : '内容一瞥'}</h4><p className={!lesson.summary ? 'english-excerpt' : ''}>{lesson.summary || lesson.excerpt}</p></section>
  <div className="cluster-links">{lesson.clusterIds.map(cid => { const cl = c.catalog.clusters.find(x => x.id === cid)!; return <button key={cid} onClick={() => nav.navigate('learn', cid)}><Icon name="route" size={16}/>{cl.name}<Icon name="chevron" size={14}/></button>; })}</div>
  <section className="detail-section"><h4>这一课的知识</h4><KPGroup ids={lesson.kpIds} onKP={kid => open({ kind: 'kp', id: kid })} max={4}/></section>
  {lesson.quality.length > 0 && <details className="source-note"><summary>原文收录说明</summary>{lesson.quality.map((q, i) => <p key={i}>{q}</p>)}{lesson.titleOrigin !== 'source' && <p>列表标题为阅读主题标签；原文件的标题文本完整保留在阅读页与来源文件中。</p>}</details>}
  <div className="adjacent-lessons">{[prev, next].map((l, i) => <button key={i} disabled={!l} onClick={() => l && open({ kind: 'lesson', id: l.id })}><span>{i === 0 ? '上一篇' : '下一篇'}</span><strong>{l ? `${l.label} · ${l.title}` : '已经到书的边界'}</strong></button>)}</div>
 </div>;
}
export function SentenceDetailsBody({ sentence, onOpen }: {
    sentence: Sentence;
    onOpen?: (e: Entity) => void;
}) {
    const c = useCorpus(), nav = useNavigation();
    const lesson = c.lessonSummary(sentence.lessonId)!;
    const open = onOpen || nav.openEntity;
    const why = { model: '适合整句记忆。抓住表达结构，再替换人物、动作或场景。', complex: '先抓主干，再逐层看修饰。顺着句中的语法提示，找到信息之间的关系。', example: '把它作为语境来读。理解词和语块在这里的作用，不必逐句背诵。' }[sentence.tier];
    return <div className="entity-detail sentence-detail"><div className="detail-kicker"><span className={'tier-label tier-' + sentence.tier}>{TIER_LABEL[sentence.tier]}</span><span className="mono">第 {String(sentence.index + 1).padStart(2, '0')} 句</span></div>
  <blockquote lang="en">{sentence.text}</blockquote><div className="detail-meta"><span>{lesson.label}</span><span>{sentence.wc} 词</span><span>{sentence.clauses} 处从句线索</span></div>
  <EntityActions entity={{ kind: 'sentence', id: sentence.id }}/>
  <section className="detail-section why-learn"><h4>怎样读这一句</h4><p>{why}</p></section>
  {sentence.sourceKind === 'heading' && lesson.quality.length > 0 && <p className="subtle-warning"><Icon name="warning" size={14}/>本句保留了原文件标题中的可见文字，可能不完整。</p>}
  <section className="detail-section"><h4>句中知识点</h4><KPGroup ids={[...new Set(sentence.hits.map(x => x[0]))]} onKP={id => open({ kind: 'kp', id })} max={5}/></section>
  <Button variant="outline" className="full" onClick={() => nav.read(sentence.lessonId, sentence.id)}><Icon name="return" size={16}/>回到这一句</Button>
 </div>;
}
function SentenceDetail({ id, onOpen }: {
    id: string;
    onOpen?: (e: Entity) => void;
}) { const c = useCorpus(); const { data, loading, error, retry } = useAsync(() => c.sentence(id), [id]); if (loading)
    return <Loader />; if (error)
    return <ErrorState text={error} onRetry={retry}/>; return data ? <SentenceDetailsBody sentence={data} onOpen={onOpen}/> : null; }
