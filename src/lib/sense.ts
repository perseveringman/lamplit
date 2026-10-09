// 语境释义的读取与展示标签。
//
// 释义存在于两个层级，UI 必须把两者的区别说清楚，否则学习者无法判断
// 「这是这句话里的意思」还是「这是这个词最常见的意思」：
//   - 语境义：hit 级，来自 lessons[].glosses[hit[3]]
//   - 核心义：词条级，来自 KP.coreSense（词典首义）
import type { Hit, KP, Lesson, Sentence } from './types';

/** 解析方法的可读来源标签。 */
const METHOD_LABEL: Record<string, string> = {
  'source-inline': '课本原注',
  llm: '语境判定',
  chunk: '语块释义',
  'editorial-single': '整理释义',
  'editorial-first': '整理释义',
  'single-sense': '词典',
  'pos-match': '词典 + 词性',
  'pos-match-multi': '词典 + 词性',
  'first-sense': '词典常用义',
  'pos-ratio': '词典词性比例',
};

/** 把 `pos-match-multi+lemma` 这样的方法串渲染成给学习者看的一句话。 */
export function senseSourceLabel(method: string | undefined): string {
  if (!method) return '词典';
  const parts = method.split('+');
  const base = METHOD_LABEL[parts[0]] || '词典';
  if (parts.includes('lemma')) return `${base}（原形）`;
  return base;
}

export interface ContextSense {
  /** 这个词在「这一句」里的意思 */
  gloss: string;
  /** 来源标签 */
  source: string;
  method: string;
  /** 是否直接来自语块（此时词义由语块承担） */
  fromChunk: boolean;
  /** 语块名，fromChunk 时有值 */
  chunkName?: string;
}

/**
 * 取出某个知识点在某一句话里的语境义。
 * 找不到（词典层未生成、或该句没有这个词）时返回 null，UI 应回退到核心义。
 */
export function contextSense(lesson: Lesson | undefined, sentence: Sentence | undefined, kpId: string): ContextSense | null {
  if (!lesson || !sentence || !lesson.glosses?.length) return null;
  const hit = sentence.hits.find((h: Hit) => h[0] === kpId && h.length > 3);
  if (!hit || hit[3] === undefined) return null;
  const gloss = lesson.glosses[hit[3]];
  if (!gloss) return null;
  const method = (hit[4] !== undefined ? lesson.glossMethods?.[hit[4]] : '') || '';
  return {
    gloss,
    method,
    source: senseSourceLabel(method),
    // 方法为 chunk 时，这个位置的词义由语块承担，UI 应说明而不是假装是这个词的义项
    fromChunk: method === 'chunk',
  };
}

/** 词条的核心义（词典首义）。这是「有出处的根义」，不是生成的词源。 */
export function coreSenseOf(kp: KP | undefined): string | null {
  return kp?.coreSense || kp?.meaning || null;
}
