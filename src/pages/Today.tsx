import React, { useMemo, useState, useEffect } from 'react';
import { useCorpus } from '../lib/data';
import { useStore } from '../lib/store';
import { useNavigation } from '../lib/navigation';
import { dueCards } from '../lib/fsrs';
import { coverageOf, retentionOf, masteryOf, streakOf } from '../lib/progress';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui/button';

/**
 * 今日页。
 *
 * 这一页只回答四个问题，顺序固定：
 *   继续读什么 → 有多少要复习 → 攒下了多少 → 今天想做什么
 *
 * 三条进度轴**分开显示，不合成一个百分比**（见 progress.ts 的说明）：
 * 「覆盖高 / 沉淀低」和「覆盖低 / 掌握高」是两种完全不同的状态，
 * 合成一个数字会把这层信息抹掉。
 */
export default function Today() {
  const c = useCorpus(), s = useStore(), nav = useNavigation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const due = useMemo(() => dueCards(s.data.cards, now).length, [s.data.cards, now]);
  const reading = s.data.reading;
  const lesson = reading ? c.lessonSummary(reading.lessonId) : null;
  const total = c.catalog.lessons.length;

  const cov = coverageOf(s.data, total);
  const ret = retentionOf(s.data);
  const mas = masteryOf(s.data);
  const streak = streakOf(s.data, now);

  const visited = reading ? (s.data.lessons?.[reading.lessonId]?.visited?.length || 0) : 0;
  const totalSentences = lesson?.sentenceCount || 0;
  const pct = totalSentences ? Math.round((100 * Math.min(visited, totalSentences)) / totalSentences) : 0;

  const migrating = s.data.migratedFrom === 1;

  return <div className="today-page">
    <div className="page-heading">
      <div className="eyebrow">今天</div>
      <h1>读一点，<em>留下一点。</em></h1>
      <p>{streak > 0 ? `已经连续 ${streak} 天打开它了。` : '今天从任何一课开始都可以。'}</p>
    </div>

    {/* ① 继续读 */}
    <section className="today-block today-resume">
      {lesson && reading ? <>
        <div className="today-block-head"><span className="eyebrow">继续读</span><span className="mono">{lesson.label}</span></div>
        <h2>{lesson.title}</h2>
        {lesson.titleZh && <p className="muted">{lesson.titleZh}</p>}
        <div className="today-progress"><div className="today-progress-bar"><i style={{ width: pct + '%' }}/></div><span className="mono">{visited}/{totalSentences} 句</span></div>
        <Button onClick={() => nav.read(reading.lessonId, reading.sentenceId)}><Icon name="book" size={16}/>从上次停下的一句继续</Button>
      </> : <>
        <div className="today-block-head"><span className="eyebrow">开始读</span></div>
        <h2>还没有阅读记录</h2>
        <p className="muted">挑一课开始，读到哪一句都会自动记住。</p>
        <Button onClick={() => nav.read(c.catalog.defaultLesson)}><Icon name="book" size={16}/>从第一课开始</Button>
      </>}
    </section>

    <div className="today-row">
      {/* ② 待复习 */}
      <section className="today-block today-due">
        <div className="today-block-head"><span className="eyebrow">待复习</span></div>
        <strong className="today-number">{due}</strong>
        <p className="muted">{due ? '张卡片到期' : '暂时没有到期的卡片'}</p>
        <Button variant="outline" onClick={() => nav.navigate('cards', undefined, undefined)} disabled={!due}>
          <Icon name="cards" size={16}/>{due ? '现在复习' : '去攒卡片'}
        </Button>
      </section>

      {/* ③ 攒下了多少：三轴分开 */}
      <section className="today-block today-axes">
        <div className="today-block-head"><span className="eyebrow">攒下了多少</span></div>
        <dl className="axis-list">
          <div><dt>覆盖</dt><dd>{cov.lessonsRead}<small> / {cov.lessonsTotal} 课</small></dd><span className="axis-note">有阅读记录的课</span></div>
          <div><dt>沉淀</dt><dd>{ret.cards}<small> 张卡 · {ret.inReview} 张进入复习</small></dd><span className="axis-note">其中 {ret.mature} 张已记住</span></div>
          <div><dt>掌握</dt><dd>{mas.rate === null ? '—' : mas.rate + '%'}<small>{mas.rate === null ? '' : ` · ${mas.attempts} 次复习期内回忆`}</small></dd><span className="axis-note">{mas.rate === null ? '还没有复习记录' : '复习期内的回忆成功率'}</span></div>
        </dl>
        {migrating && <p className="today-note"><Icon name="warning" size={13}/>历史阅读记录的时间不可考，覆盖与连续天数从本次迁移后开始统计。</p>}
      </section>
    </div>

    {/* ④ 今天想做什么 */}
    <section className="today-block today-actions">
      <div className="today-block-head"><span className="eyebrow">或者</span></div>
      <div className="today-action-grid">
        <button onClick={() => nav.navigate('learn', undefined, undefined)}><Icon name="route" size={18}/><span>接着上次的进度连学</span></button>
        <button onClick={() => nav.navigate('index', undefined, undefined)}><Icon name="list" size={18}/><span>找一个词或一种表达</span></button>
        <button onClick={() => nav.navigate('atlas', c.catalog.defaultKP)}><Icon name="network" size={18}/><span>看看知识之间的关系</span></button>
      </div>
    </section>
  </div>;
}
