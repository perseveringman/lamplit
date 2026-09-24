import React from 'react';
import { useCorpus } from '../lib/data';
import { useStore, swallow } from '../lib/store';
import { useNavigation } from '../lib/navigation';
import type { Entity } from '../lib/types';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { EntityDetail } from '../components/Details';
import { Button } from '../components/ui/button';
import { Icon } from '../components/Icon';
export default function Atlas({ id }: {
    id?: string;
}) {
    const c = useCorpus(), s = useStore(), nav = useNavigation();
    const center = c.kp(id || '')?.id || c.catalog.defaultKP;
    const select = (e: Entity) => { if (e.kind === 'kp') {
        if (window.innerWidth < 640 && e.id === center)
            nav.openEntity(e);
        else
            nav.navigate('atlas', e.id, window.innerWidth < 640 ? { detail: '1' } : {});
    }
    else
        nav.openEntity(e); };
    const lesson = c.lessonSummary(s.data.reading?.lessonId || c.catalog.defaultLesson)!;
    return <div className="atlas-page"><div className="page-heading atlas-heading"><div><div className="eyebrow"><span className="tiny-star">✧</span> 知识星图</div><h1>让每一次阅读，<em>连成理解。</em></h1><p>从一个知识点出发，发现它在课文里的不同用法。</p></div><div className="atlas-total"><strong>{c.catalog.stats.lessons}</strong><span>篇课文，彼此相连</span></div></div>
 {!s.data.welcomeDismissed && <div className="journey-guide"><div className="guide-step"><span>01</span><p>选一篇课文<strong>从熟悉的话题开始</strong></p></div><Icon name="arrow" size={16}/><div className="guide-step"><span>02</span><p>点开一句原文<strong>在上下文中理解</strong></p></div><Icon name="arrow" size={16}/><div className="guide-step"><span>03</span><p>留住值得学的<strong>保存后，适时回看</strong></p></div><Button variant="ghost" size="icon" aria-label="收起学习引导" onClick={() => swallow(s.dismissWelcome())}><Icon name="close" size={16}/></Button></div>}
 <div className="atlas-layout"><div className="atlas-left"><div className="map-card"><div className="map-toolbar"><div><span className="status-dot"/>正在探索 <strong>{c.kp(center)?.name}</strong></div>{center !== c.catalog.defaultKP && <Button variant="ghost" size="sm" onClick={() => nav.navigate('atlas', c.catalog.defaultKP)}><Icon name="return" size={15}/>回到起点</Button>}</div><KnowledgeGraph centerId={center} onSelect={select}/></div>
 <article className="continue-card"><div className="continue-icon"><Icon name="book" size={25}/></div><div><span className="eyebrow">{s.data.reading ? '上次读到这里' : '从这一课开始'}</span><h3>{lesson.title}</h3><p><span className="mono">{lesson.label}</span> · {lesson.scene}</p></div><Button variant="secondary" onClick={() => nav.openEntity({ kind: 'lesson', id: lesson.id })}>{s.data.reading ? '继续阅读' : '看看这一课'}<Icon name="arrow" size={17}/></Button></article></div>
 <aside className="paper atlas-detail"><EntityDetail entity={{ kind: 'kp', id: center }} onOpen={select}/></aside></div></div>;
}
