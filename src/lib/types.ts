export type KPType = 'word' | 'chunk' | 'pattern' | 'grammar';
export type Tier = 'model' | 'complex' | 'example';
export type EntityKind = 'kp' | 'sentence' | 'lesson';
export interface Entity {
    kind: EntityKind;
    id: string;
}
export type Hit = [
    kpId: string,
    start: number,
    end: number
];
export interface KP {
    id: string;
    type: KPType;
    name: string;
    meaning: string;
    provenance: string;
    parent: string | null;
    lemma: string | null;
    lessonIds: string[];
    related: string[];
    contains: string[];
    degree: number;
    frequency: number;
}
export interface Sentence {
    id: string;
    lessonId: string;
    index: number;
    text: string;
    wc: number;
    clauses: number;
    tier: Tier;
    hits: Hit[];
    connectives: [
        number,
        number
    ][];
    sourceLine: number;
    sourceEndLine: number;
    sourceKind: 'heading' | 'body';
    sourceStart: number;
    sourceBlock: string;
}
export type SentenceSummary = Pick<Sentence, 'id' | 'lessonId' | 'text' | 'wc' | 'clauses' | 'tier'>;
export interface LessonSummary {
    id: string;
    book: number;
    sequence: number;
    no: number;
    label: string;
    title: string;
    titleZh: string;
    titleOrigin: string;
    sourceHeading: string;
    sourceFile: string;
    sourceLine: number;
    sourceEndLine: number;
    quality: string[];
    scene: string;
    canDo: string;
    summary: string;
    excerpt: string;
    genre: string;
    clusterIds: string[];
    kpIds: string[];
    focus: string[];
    wc: number;
    sentenceCount: number;
}
export interface Lesson extends LessonSummary {
    sentences: Sentence[];
    sourceBody: string;
}
export interface Cluster {
    id: string;
    stage: string;
    name: string;
    description: string;
    scene: string;
    index: number;
    lessonIds: string[];
}
export interface Book {
    id: number;
    name: string;
    en: string;
    subtitle: string;
    roman: string;
    count: number;
}
export interface Pair {
    a: string;
    b: string;
    count: number;
    kpIds: string[];
    overlap: number;
}
export interface Catalog {
    version: number;
    contentVersion: string;
    books: Book[];
    clusters: Cluster[];
    lessons: LessonSummary[];
    kps: KP[];
    defaultKP: string;
    defaultLesson: string;
    stats: {
        lessons: number;
        sentences: number;
        kps: number;
        clusters: number;
        byType: Record<KPType, number>;
        tiers: Record<Tier, number>;
        glossedWords: number;
        contextWords: number;
        pairs: number;
        hits: number;
    };
}
export type Grade = 1 | 2 | 3 | 4;
export type MemoryState = 'new' | 'learning' | 'review' | 'relearning';
export interface MemoryCard {
    id: string;
    entity: Entity;
    createdAt: number;
    due: number;
    lastReview: number | null;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    state: MemoryState;
    paused: boolean;
    weakAtCreation: boolean;
    contentVersion: string;
}
export interface Flag {
    star: boolean;
    weak: boolean;
}
export interface ReviewLog {
    id: string;
    cardId: string;
    at: number;
    grade: Grade;
    previousState: MemoryState;
    nextState: MemoryState;
    intervalDays: number;
    elapsedDays: number;
    sessionId: string;
}
export interface ReadingPosition {
    lessonId: string;
    sentenceId: string;
    at: number;
}
export interface Session {
    id: string;
    queue: string[];
    cursor: number;
    flipped: boolean;
    startedAt: number;
    finishedAt: number | null;
    ratings: Grade[];
    intervalDays: number[];
}
export interface Layers {
    pattern: boolean;
    grammar: boolean;
    chunk: boolean;
    word: boolean;
    connective: boolean;
    genre: boolean;
}
export interface UserData {
    version: 1;
    revision: number;
    cards: Record<string, MemoryCard>;
    flags: Record<string, Flag>;
    reviews: ReviewLog[];
    retention: number;
    reading: ReadingPosition | null;
    bookmarks: Record<string, string>;
    layers: Layers;
    welcomeDismissed: boolean;
    session: Session | null;
    readerSize: number;
}
export const TYPE_LABEL: Record<KPType, string> = { grammar: '语法', pattern: '句型', chunk: '语块', word: '词' };
export const TYPE_ORDER: KPType[] = ['grammar', 'pattern', 'chunk', 'word'];
export const TIER_LABEL: Record<Tier, string> = { model: '范句', complex: '长难句', example: '例句' };
export const STATE_LABEL: Record<MemoryState, string> = { new: '新卡', learning: '学习中', review: '复习中', relearning: '重新学习' };
export const entityKey = (entity: Entity) => `${entity.kind}:${entity.id}`;
