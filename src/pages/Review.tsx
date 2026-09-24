import React, { useEffect, useState } from 'react';
import { useCorpus, useAsync } from '../lib/data';
import { useStore, swallow } from '../lib/store';
import { useNavigation } from '../lib/navigation';
import { scheduleOptions, intervalLabel, DAY } from '../lib/fsrs';
import type { Grade, MemoryCard } from '../lib/types';
import { TYPE_LABEL } from '../lib/types';
import { EntityDetail } from '../components/Details';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { Icon } from '../components/Icon';
import { EmptyState, ErrorState, Loader, TypeBadge } from '../components/Common';
const grades: {
    value: Grade;
    label: string;
    hint: string;
}[] = [{ value: 1, label: '忘记', hint: '完全没想起来' }, { value: 2, label: '困难', hint: '想得很艰难' }, { value: 3, label: '记得', hint: '基本想起来了' }, { value: 4, label: '轻松', hint: '毫不费力' }];
export default function Review() {
    const c = useCorpus(), s = useStore(), nav = useNavigation();
    const session = s.data.session;
    const [exit, setExit] = useState(false), [working, setWorking] = useState(false);
    const card = session ? s.data.cards[session.queue[session.cursor]] : undefined;
    const flip = () => { if (!working)
        swallow(s.flip()); };
    const grade = async (g: Grade) => { if (working)
        return; setWorking(true); try {
        await s.grade(g);
    }
    finally {
        setWorking(false);
    } };
    useEffect(() => { const key = (e: KeyboardEvent) => { if (exit || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) || ((e.target as HTMLElement)?.closest('dialog[open]')))
        return; if (!session || session.finishedAt)
        return; if (e.code === 'Space' && !session.flipped) {
        e.preventDefault();
        flip();
    }
    else if (session.flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        swallow(grade(Number(e.key) as Grade));
    } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [session, working, exit]);
    if (!session)
        return <EmptyState title="给记忆一点时间" text="从已保存的卡片里，开始一次回看。" action={<Button onClick={() => nav.navigate('cards')}>回到我的卡片</Button>}/>;
    if (session.finishedAt || !card) {
        const total = session.ratings.length;
        const minutes = Math.max(1, Math.round(((session.finishedAt || Date.now()) - session.startedAt) / 60000));
        const nextDue = Math.min(...Object.values(s.data.cards).filter(x => !x.paused).map(x => x.due));
        return <div className="review-summary"><div className="summary-orbit"><Icon name="check" size={42}/></div><span className="eyebrow">这一段回看，已留下</span><h1>{total ? '又熟悉了一点。' : '按自己的节奏来。'}</h1><p>{total ? `回看 ${total} 张 · 用时约 ${minutes} 分钟` : '这次没有评分，也没有改动卡片进度。'}</p><div className="summary-grades">{grades.map(g => <div key={g.value}><strong>{session.ratings.filter(x => x === g.value).length}</strong><span>{g.label}</span></div>)}</div>{total > 0 && <p className="small muted">下次间隔合计 {session.intervalDays.reduce((a, b) => a + b, 0).toFixed(1)} 天 · 最近到期 {Number.isFinite(nextDue) ? nextDue <= Date.now() ? '现在' : intervalLabel((nextDue - Date.now()) / DAY) + '后' : '暂无'}</p>}<div className="summary-actions"><Button onClick={() => nav.navigate('cards')}>回到我的卡片<Icon name="arrow" size={16}/></Button><Button variant="outline" onClick={() => nav.navigate('learn')}>继续读一篇</Button></div></div>;
    }
    const options = scheduleOptions(card, s.data.retention);
    return <div className="review-page"><header className="review-header"><Button variant="ghost" size="sm" onClick={() => setExit(true)}><Icon name="back" size={17}/>暂时离开</Button><div className="review-progress"><span className="mono">{session.cursor + 1} <i>/ {session.queue.length}</i></span><div><span style={{ width: 100 * session.cursor / session.queue.length + '%' }}/></div></div><span className="review-mode">{session.flipped ? '回到语境' : '先试着回忆'}</span></header><div className={'review-card paper ' + (session.flipped ? 'is-flipped' : '')} key={card.id + String(session.flipped)}>{session.flipped ? <><div className="review-card-kicker"><Icon name="return" size={15}/><span>每一处出处，都能回到原文</span></div><EntityDetail entity={card.entity}/></> : <CardFront card={card}/>}</div>
 <div className="review-controls">{session.flipped ? <><p>刚才回忆得怎么样？</p><div className="grade-buttons">{grades.map(g => <button className={'grade-button grade-' + g.value} disabled={working} key={g.value} onClick={() => swallow(grade(g.value))}><span><kbd>{g.value}</kbd>{g.label}</span><small>{intervalLabel(options[g.value].intervalDays)}</small></button>)}</div></> : <><Button size="lg" className="flip-button" onClick={flip}>看看原来的语境<Icon name="arrow" size={18}/></Button><p className="keyboard-hint"><kbd>Space</kbd> 翻面</p></>}</div>
 <Dialog open={exit} onClose={() => setExit(false)} title="按自己的节奏来" description="已评分的卡片已经保存。暂时离开后，可以继续这次会话。"><div className="dialog-actions"><Button variant="outline" onClick={() => setExit(false)}>继续回看</Button><Button onClick={() => nav.navigate('cards')}>暂时离开</Button></div><Button variant="ghost" className="full" onClick={() => swallow(s.endSession().then(() => setExit(false)))}>结束本次会话</Button></Dialog></div>;
}
function CardFront({ card }: {
    card: MemoryCard;
}) { const c = useCorpus(); const content = useAsync(async () => { if (card.entity.kind === 'kp') {
    const k = c.kp(card.entity.id);
    if (!k)
        throw new Error('没有找到这张卡片的来源');
    return { title: k.name, subtitle: k.meaning, type: k.type, instruction: k.type === 'word' ? '想一想，它在原句里表达了什么。' : '回忆它的用法，试着想起一句原文。' };
} if (card.entity.kind === 'lesson') {
    const l = c.lessonSummary(card.entity.id)!;
    return { title: l.title, subtitle: l.scene, type: 'lesson' as const, instruction: '回想这篇课文的内容，以及其中值得留下的表达。' };
} const sentence = await c.sentence(card.entity.id); return { title: sentence.text, subtitle: '', type: 'sentence' as const, instruction: '试着抓住主干，回忆句中表达的含义。' }; }, [card.id]); if (content.loading)
    return <Loader />; if (content.error)
    return <ErrorState text={content.error} onRetry={content.retry}/>; const item = content.data!; return <div className="card-front"><TypeBadge type={item.type}/><span className="card-star">✧</span><h1 lang={item.type === 'grammar' || item.type === 'pattern' ? 'zh-CN' : 'en'}>{item.title}</h1>{item.subtitle && <p className="card-front-subtitle">{item.subtitle}</p>}<p className="card-prompt">{item.instruction}</p></div>; }
