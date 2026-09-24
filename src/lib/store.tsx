import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Entity, Grade, Layers, MemoryCard, Session, UserData } from './types';
import { entityKey } from './types';
import { uniqueId } from './utils';
import { createCard, dueCards, scheduleOptions, DAY } from './fsrs';
const DATABASE = 'lamplit-reader-v1';
const fresh = (): UserData => ({ version: 1, revision: 0, cards: {}, flags: {}, reviews: [], retention: 0.9, reading: null, bookmarks: {}, layers: { pattern: true, grammar: true, chunk: true, word: false, connective: false, genre: true }, welcomeDismissed: false, session: null, readerSize: 20 });
function normalize(data: unknown): UserData {
    if (!data)
        return fresh();
    const d = data as UserData;
    if (d.version !== 1 || typeof d.cards !== 'object' || !Array.isArray(d.reviews))
        throw new Error('本地记录的版本暂时无法读取，原数据未被覆盖。');
    return { ...fresh(), ...d, layers: { ...fresh().layers, ...d.layers }, bookmarks: d.bookmarks || {} };
}
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DATABASE, 1); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('state'))
    request.result.createObjectStore('state'); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error('请关闭另一个旧版本页面后重试。')); }); }
function readDB(db: IDBDatabase): Promise<UserData> { return new Promise((resolve, reject) => { const tx = db.transaction('state', 'readonly'); const r = tx.objectStore('state').get('root'); r.onsuccess = () => { try {
    resolve(normalize(r.result));
}
catch (e) {
    reject(e);
} }; r.onerror = () => reject(r.error); }); }
// Read-modify-write happens inside ONE transaction: star+card and grade+log are atomic.
function writeDB(db: IDBDatabase, mutator: (data: UserData) => void): Promise<UserData> { return new Promise((resolve, reject) => { const tx = db.transaction('state', 'readwrite'); const store = tx.objectStore('state'); let result: UserData; const get = store.get('root'); get.onsuccess = () => { try {
    result = normalize(get.result);
    mutator(result);
    result.revision++;
    store.put(result, 'root');
}
catch (e) {
    tx.abort();
    reject(e);
} }; tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('保存未完成')); }); }
interface Toast {
    id: number;
    text: string;
    error?: boolean;
}
interface StoreAPI {
    data: UserData;
    ready: boolean;
    storageError: string | null;
    toasts: Toast[];
    notify: (text: string, error?: boolean) => void;
    save: (e: Entity) => Promise<void>;
    star: (e: Entity) => Promise<void>;
    weak: (e: Entity) => Promise<void>;
    setLayers: (patch: Partial<Layers>) => Promise<void>;
    readPosition: (lessonId: string, sentenceId: string) => Promise<void>;
    setRetention: (n: number) => Promise<void>;
    setReaderSize: (n: number) => Promise<void>;
    dismissWelcome: () => Promise<void>;
    batch: (ids: string[], action: 'delete' | 'pause' | 'resume' | 'reset') => Promise<void>;
    startSession: () => Promise<boolean>;
    flip: () => Promise<void>;
    grade: (grade: Grade) => Promise<void>;
    endSession: () => Promise<void>;
}
const StoreContext = createContext<StoreAPI | null>(null);
export function StoreProvider({ children }: {
    children: React.ReactNode;
}) {
    const [data, setData] = useState(fresh);
    const [ready, setReady] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const db = useRef<IDBDatabase | null>(null);
    const channel = useRef<BroadcastChannel | null>(null);
    const queue = useRef(Promise.resolve());
    const notify = useCallback((text: string, error = false) => { const id = Date.now() + Math.random(); setToasts(t => [...t.slice(-2), { id, text, error }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200); }, []);
    useEffect(() => {
        let active = true;
        openDB().then(async (database) => {
            if (!active) {
                database.close();
                return;
            }
            db.current = database;
            const value = await readDB(database);
            if (active) {
                setData(value);
                setReady(true);
            }
            if (typeof BroadcastChannel !== 'undefined') {
                channel.current = new BroadcastChannel(DATABASE);
                channel.current.onmessage = () => { if (db.current)
                    void readDB(db.current).then(value => { if (active)
                        setData(prev => value.revision > prev.revision ? value : prev); }).catch(() => { }); };
            }
        }).catch(e => { if (active) {
            setStorageError(e instanceof Error ? e.message : '本地保存暂不可用，请允许网站存储。');
            setReady(true);
        } });
        return () => { active = false; channel.current?.close(); db.current?.close(); };
    }, []);
    const update = useCallback((mutator: (d: UserData) => void): Promise<void> => {
        const op = queue.current.catch(() => { }).then(async () => { if (!db.current)
            throw new Error('本地保存暂不可用，操作尚未保存。'); const next = await writeDB(db.current, mutator); setData(previous => next.revision >= previous.revision ? next : previous); channel.current?.postMessage(next.revision); });
        queue.current = op;
        return op.catch(e => { notify(e instanceof Error ? e.message : '保存失败，请重试。', true); throw e; });
    }, [notify]);
    const save = useCallback(async (e: Entity) => { let exists = false; await update(d => { const key = entityKey(e); exists = !!d.cards[key]; if (!exists)
        d.cards[key] = createCard(e, !!d.flags[key]?.weak); }); notify(exists ? '这张卡片已经保存过了' : '已保存为卡片，随时可以复习'); }, [update, notify]);
    const star = useCallback(async (e: Entity) => { let marked = false; await update(d => { const key = entityKey(e); const f = d.flags[key] || { star: false, weak: false }; marked = !f.star; d.flags[key] = { ...f, star: marked }; if (marked && !d.cards[key])
        d.cards[key] = createCard(e, f.weak); }); notify(marked ? '已标为重点，并加入卡片' : '已取消重点，卡片仍保留'); }, [update, notify]);
    const weak = useCallback(async (e: Entity) => { let marked = false; await update(d => { const key = entityKey(e); const f = d.flags[key] || { star: false, weak: false }; marked = !f.weak; d.flags[key] = { ...f, weak: marked }; const card = d.cards[key]; if (marked && card && card.reps === 0) {
        card.weakAtCreation = true;
        card.stability = 0.05;
        card.due = Math.min(card.due, Date.now() - 60000);
    } }); notify(marked ? '已标记为不熟悉' : '已取消不熟悉标记'); }, [update, notify]);
    const setLayers = useCallback((patch: Partial<Layers>) => update(d => { d.layers = { ...d.layers, ...patch }; }), [update]);
    const readPosition = useCallback((lessonId: string, sentenceId: string) => update(d => { d.reading = { lessonId, sentenceId, at: Date.now() }; d.bookmarks[lessonId] = sentenceId; }), [update]);
    const setRetention = useCallback(async (n: number) => { if (n < 0.75 || n > 0.97 || !Number.isFinite(n))
        throw new Error('保留率不在允许范围内'); await update(d => { d.retention = n; }); notify('复习频率已更新，将用于下一次评分'); }, [update, notify]);
    const setReaderSize = useCallback((n: number) => update(d => { d.readerSize = Math.min(26, Math.max(16, n)); }), [update]);
    const dismissWelcome = useCallback(() => update(d => { d.welcomeDismissed = true; }), [update]);
    const batch = useCallback(async (ids: string[], action: 'delete' | 'pause' | 'resume' | 'reset') => { await update(d => { ids.forEach(id => { const card = d.cards[id]; if (!card)
        return; if (action === 'delete') {
        delete d.cards[id];
        if (d.flags[id])
            d.flags[id].star = false;
    }
    else if (action === 'reset') {
        const reset = createCard(card.entity, !!d.flags[id]?.weak);
        reset.createdAt = card.createdAt;
        d.cards[id] = reset;
    }
    else
        card.paused = action === 'pause'; }); if (d.session && !d.session.finishedAt) {
        const prefix = d.session.queue.slice(0, d.session.cursor);
        const rest = d.session.queue.slice(d.session.cursor).filter(id => !!d.cards[id] && !d.cards[id].paused);
        d.session.queue = [...prefix, ...rest];
        if (!rest.length)
            d.session.finishedAt = Date.now();
    } }); notify({ delete: '卡片已删除', pause: '已暂停复习', resume: '已恢复复习', reset: '进度已重置，原始保存时间保留' }[action]); }, [update, notify]);
    const startSession = useCallback(async () => {
        let started = false;
        await update(d => {
            const active = d.session;
            if (active && !active.finishedAt && active.cursor < active.queue.length) {
                started = true;
                return;
            }
            const cards = dueCards(d.cards);
            if (!cards.length)
                return;
            const session: Session = { id: uniqueId(), queue: cards.map(c => c.id), cursor: 0, flipped: false, startedAt: Date.now(), finishedAt: null, ratings: [], intervalDays: [] };
            d.session = session;
            started = true;
        });
        return started;
    }, [update]);
    const flip = useCallback(() => update(d => { if (d.session && !d.session.finishedAt)
        d.session.flipped = true; }), [update]);
    const grade = useCallback(async (g: Grade) => {
        await update(d => {
            const session = d.session;
            if (!session || session.finishedAt || !session.flipped)
                return;
            const card = d.cards[session.queue[session.cursor]];
            if (!card || card.paused)
                return;
            const now = Date.now();
            const result = scheduleOptions(card, d.retention, now)[g];
            d.cards[card.id] = result.card;
            d.reviews.push({ id: uniqueId(), cardId: card.id, at: now, grade: g, previousState: card.state, nextState: result.card.state, intervalDays: result.intervalDays, elapsedDays: card.lastReview === null ? 0 : Math.max(0, (now - card.lastReview) / DAY), sessionId: session.id });
            session.ratings.push(g);
            session.intervalDays.push(result.intervalDays);
            session.cursor++;
            session.flipped = false;
            if (session.cursor >= session.queue.length)
                session.finishedAt = now;
        });
    }, [update]);
    const endSession = useCallback(() => update(d => { if (d.session)
        d.session.finishedAt = Date.now(); }), [update]);
    const api: StoreAPI = { data, ready, storageError, toasts, notify, save, star, weak, setLayers, readPosition, setRetention, setReaderSize, dismissWelcome, batch, startSession, flip, grade, endSession };
    return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
export function useStore() { const value = useContext(StoreContext); if (!value)
    throw new Error('Store is not initialized'); return value; }
export function swallow(promise: Promise<unknown>) { void promise.catch(() => { }); }
