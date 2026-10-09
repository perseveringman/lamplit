import { createContext, useContext, useEffect, useState } from 'react';
import type { QuizItem, TeachingPoint, Catalog, KP, Lesson, LessonSummary, Pair, Sentence, SentenceSummary } from './types';
import { lessonFromSentence, sourceBook } from './utils';
const BASE = './data/';
const requests = new Map<string, Promise<unknown>>();
export function loadJSON<T>(name: string): Promise<T> {
    if (requests.has(name))
        return requests.get(name) as Promise<T>;
    const promise = (async () => {
        // Static precompressed data also works on a plain static host without content-encoding rules.
        if ('DecompressionStream' in globalThis) {
            try {
                const compressed = await fetch(BASE + name + '.gz');
                if (compressed.ok && compressed.body) {
                    const stream = compressed.body.pipeThrough(new DecompressionStream('gzip'));
                    return await new Response(stream).json() as T;
                }
            }
            catch { /* A plain JSON fallback handles older browsers and hosts transforming gzip files. */ }
        }
        const response = await fetch(BASE + name);
        if (!response.ok)
            throw new Error('课文暂时没有加载成功，请重试。');
        return await response.json() as T;
    })().catch(error => { requests.delete(name); throw error; });
    requests.set(name, promise);
    return promise;
}
export class Corpus {
    private tpIndex?: Map<string, TeachingPoint[]>;
    private quizIndex?: Map<string, QuizItem[]>;
    readonly kpMap: Map<string, KP>;
    readonly lessonMap: Map<string, LessonSummary>;
    constructor(readonly catalog: Catalog) { this.kpMap = new Map(catalog.kps.map(k => [k.id, k])); this.lessonMap = new Map(catalog.lessons.map(l => [l.id, l])); }
    kp(id: string) { return this.kpMap.get(id); }
    lessonSummary(id: string) { return this.lessonMap.get(id); }
    /** 某一课的测验题。题目在构建期已过五条机械校验。 */
    quizOf(id: string) {
        if (!this.quizIndex) {
            this.quizIndex = new Map();
            for (const q of (this.catalog.quiz || [])) {
                const arr = this.quizIndex.get(q.lessonId) || [];
                arr.push(q); this.quizIndex.set(q.lessonId, arr);
            }
        }
        return this.quizIndex.get(id) || [];
    }
    /** 某一课的教学点。空数组表示：要么这一课没有教材事实，要么教材教的点本架构接不住。 */
    teachingPointsOf(id: string) {
        if (!this.tpIndex) {
            this.tpIndex = new Map();
            for (const tp of (this.catalog.teachingPoints || [])) {
                if (!tp.lessonId) continue;
                const arr = this.tpIndex.get(tp.lessonId) || [];
                arr.push(tp); this.tpIndex.set(tp.lessonId, arr);
            }
        }
        return this.tpIndex.get(id) || [];
    }
    async book(book: number) { return loadJSON<Lesson[]>(`books/${book}.json`); }
    async lesson(id: string): Promise<Lesson> { const result = (await this.book(sourceBook(id))).find(l => l.id === id); if (!result)
        throw new Error('没有找到这篇课文。'); return result; }
    async sentence(id: string): Promise<Sentence> { const result = (await this.lesson(lessonFromSentence(id))).sentences.find(s => s.id === id); if (!result)
        throw new Error('没有找到这句原文。'); return result; }
    async occurrences(id: string): Promise<[
        string,
        number,
        number
    ][]> { const bucket = [...id].reduce((v, c) => (v * 31 + c.charCodeAt(0)) >>> 0, 0) % 32; const all = await loadJSON<Record<string, [
        string,
        number,
        number
    ][]>>(`contexts/${bucket}.json`); return all[id] || []; }
    async contexts(id: string): Promise<Sentence[]> { const occurrences = await this.occurrences(id); const ids = [...new Set(occurrences.map(x => x[0]))]; return Promise.all(ids.map(sid => this.sentence(sid))); }
    pairs() { return loadJSON<Pair[]>('pairs.json'); }
    /** 与某一课有共同知识点的其它课文。pairs 是全局的，这里按课文取出来。 */
    async relatedOf(lessonId: string, limit = 4) {
        const pairs = await this.pairs();
        return pairs
            .filter((p) => p.a === lessonId || p.b === lessonId)
            .sort((x, y) => y.count - x.count)
            .slice(0, limit)
            .map((p) => ({ lessonId: p.a === lessonId ? p.b : p.a, count: p.count, kpIds: p.kpIds }));
    }
    sentences() { return loadJSON<SentenceSummary[]>('sentences.json'); }
}
export const CorpusContext = createContext<Corpus | null>(null);
export function useCorpus() { const c = useContext(CorpusContext); if (!c)
    throw new Error('Corpus is not initialized'); return c; }
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
    const [state, setState] = useState<{
        data: T | null;
        error: string | null;
        loading: boolean;
    }>({ data: null, error: null, loading: true });
    const [retry, setRetry] = useState(0);
    useEffect(() => { let active = true; setState({ data: null, error: null, loading: true }); loader().then(data => { if (active)
        setState({ data, error: null, loading: false }); }).catch(e => { if (active)
        setState({ data: null, error: e instanceof Error ? e.message : '加载失败，请重试。', loading: false }); }); return () => { active = false; }; }, [...deps, retry]);
    return { ...state, retry: () => setRetry(n => n + 1) };
}
