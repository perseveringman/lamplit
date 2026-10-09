import React, { useMemo, useState } from 'react';
import { useCorpus } from '../lib/data';
import { useNavigation } from '../lib/navigation';
import { EmptyState } from '../components/Common';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui/button';
import type { QuizItem } from '../lib/types';

/**
 * 精读收尾测验。
 *
 * 题目来自 `catalog.quiz`——在构建期已过五条机械校验（scripts/quiz.mjs），
 * 而且**只考该课 teachingFocus 覆盖的知识点**。
 *
 * 刻意不做的事：
 *   - 不记录成绩到 UserData。现在没有可靠的口径说"这一课的掌握度"，
 *     记一个半成品数字比不记更糟（见 progress.ts 对三条轴的说明）。
 *   - 不做计分排名。做错了就当场看解析，这是学习工具不是考试。
 */
export default function Quiz({ id }: { id?: string }) {
  const c = useCorpus(), nav = useNavigation();
  const lesson = id ? c.lessonSummary(id) : null;
  const items = useMemo(() => (id ? c.quizOf(id) : []), [c, id]);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  if (!lesson) return <EmptyState title="没有找到这一课" action={<Button onClick={() => nav.navigate('today', undefined, undefined)}>回到今天</Button>}/>;
  if (!items.length) return <div className="quiz-page"><div className="page-heading"><div className="eyebrow">收尾测验</div><h1>{lesson.title}</h1></div><EmptyState title="这一课暂时没有题目" text="题库只覆盖有 teachingFocus 的课文。可以先去读，或换一课。" action={<Button onClick={() => nav.read(lesson.id)}>回到这一课</Button>}/></div>;

  const q = items[at];
  const kp = c.kp(q.kpId);
  const answered = picked !== null;
  const correct = answered && picked === q.answerIndex;

  const next = () => {
    if (at + 1 >= items.length) { setDone(true); return; }
    setAt(at + 1); setPicked(null);
  };

  if (done) {
    const right = items.length - wrongIds.length;
    return <div className="quiz-page"><div className="quiz-done">
      <div className="eyebrow">这一课练完了</div>
      <strong className="quiz-score">{right}<small> / {items.length}</small></strong>
      <p className="muted">{wrongIds.length ? '错过的题下面再走一遍。' : '全部答对。'}</p>
      {wrongIds.length > 0 && <ul className="quiz-missed">{wrongIds.map((wid) => { const it = items.find((x) => x.id === wid)!; return <li key={wid}><span className="mono">{it.blanked || it.answer}</span>{it.blanked && <span className="muted"> — {it.answer}</span>}</li>; })}</ul>}
      <div className="quiz-actions">
        <Button variant="outline" onClick={() => { setAt(0); setPicked(null); setWrongIds([]); setDone(false); }}><Icon name="reset" size={16}/>再做一遍</Button>
        <Button onClick={() => nav.read(lesson.id)}><Icon name="book" size={16}/>回到这一课</Button>
      </div>
    </div></div>;
  }

  return <div className="quiz-page">
    <div className="page-heading">
      <div className="eyebrow">收尾测验 · {lesson.label}</div>
      <h1>{lesson.title}</h1>
    </div>
    <div className="quiz-progress"><i style={{ width: Math.round((100 * at) / items.length) + '%' }}/><span className="mono">{at + 1} / {items.length}</span></div>

    <section className="quiz-card">
      <p className="quiz-prompt">{q.kind === 'blank' ? '空里那个表达是什么意思？' : '这一句用了哪个结构？'}</p>
      <blockquote lang="en" className="quiz-stem">{q.stem}</blockquote>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          const state = !answered ? '' : i === q.answerIndex ? 'right' : i === picked ? 'wrong' : 'dim';
          return <button key={i} className={'quiz-option ' + state} disabled={answered} onClick={() => { setPicked(i); if (i !== q.answerIndex) setWrongIds((w) => w.concat(q.id)); }}>
            <span className="quiz-option-mark mono">{String.fromCharCode(65 + i)}</span><span>{opt}</span>
            {answered && i === q.answerIndex && <Icon name="check" size={16}/>}
            {answered && i === picked && i !== q.answerIndex && <Icon name="close" size={16}/>}
          </button>;
        })}
      </div>
      {answered && <div className="quiz-explain">
        <span className={'quiz-verdict ' + (correct ? 'right' : 'wrong')}>{correct ? '答对了' : '再看一眼'}</span>
        {kp && <button className="quiz-kp" onClick={() => nav.openEntity({ kind: 'kp', id: kp.id })}>{kp.name}{kp.enName ? ` · ${kp.enName}` : ''}</button>}
        {kp?.formula && <p className="quiz-formula">{kp.formula}</p>}
        <Button onClick={next}>{at + 1 >= items.length ? '看结果' : '下一题'}<Icon name="next" size={15}/></Button>
      </div>}
    </section>
  </div>;
}
