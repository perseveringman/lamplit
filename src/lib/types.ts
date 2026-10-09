export type KPType = 'word' | 'chunk' | 'pattern' | 'grammar';
export type EntityKind = 'kp' | 'sentence' | 'lesson';
export interface Entity {
    kind: EntityKind;
    id: string;
}
/**
 * 一次命中的位置，以及它在「语境释义表」里的下标。
 * [kpId, start, end, glossIndex?, methodIndex?]
 * 后两项可选：词典缓存缺失时整层跳过，这里是 undefined。
 */
export type Hit = [
    kpId: string,
    start: number,
    end: number,
    glossIndex?: number,
    methodIndex?: number
];
/** 教学点：教材要教的东西。与「检测到的语言对象」解耦——refs 为空表示本架构接不住。 */
export interface TeachingPoint {
    id: string;
    lessonId: string | null;
    book: number;
    officialLesson: number;
    /** 标题自撰（用我方规则名），不抄外部材料的表述 */
    title: string;
    kind: string;
    /** 指向真实存在的规则；为空数组表示「教材教它，但本工具未覆盖」 */
    refs: string[];
    hits: number;
    covered: boolean;
    confidence: string;
    provenance: string;
}

/** 测验题。五条机械校验在构建期跑过（scripts/quiz.mjs），这里只描述形状。 */
export interface QuizItem {
    id: string;
    lessonId: string;
    sentenceId: string;
    kpId: string;
    kind: 'blank' | 'structure';
    stem: string;
    /** 填空题被挖掉的原文；结构题没有这个字段 */
    blanked?: string;
    answer: string;
    options: string[];
    answerIndex: number;
}

export interface KP {
    /** 英文语法术语（自撰的标准术语，非外部材料） */
    enName?: string | null;
    /** 结构公式，如「be + 过去分词」 */
    formula?: string | null;
    /** 难度，由教材引入册派生；无引入册依据时为 null */
    level?: 'basic' | 'intermediate' | 'upper' | 'advanced' | null;
    /** 教材引入册（1..4），未知为 null */
    introduceBook?: number | null;
    /** 每册角色：introduce（引入册）/ reuse（后续册被再次使用） */
    bookRoles?: Record<number, 'introduce' | 'reuse' | 'contrast' | 'fluency'>;
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
    /** 词典核心义（首义），有出处，不是生成的词源 */
    coreSense?: string | null;
    corePos?: string | null;
    /** 英文释义——理解词根义靠它，中文翻译给不了 */
    enDefinition?: string | null;
    /** 词伙：屈折形式，来自 ECDICT 的 exchange */
    wordFamily?: string[] | null;
    /** 柯林斯星级 0–5 */
    collins?: number;
    /** 考纲标签：zk / gk / cet4 / cet6 / ky / toefl / ielts / gre */
    examTags?: string[] | null;
}
export interface Sentence {
    id: string;
    lessonId: string;
    index: number;
    text: string;
    wc: number;
    clauses: number;
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
    analysis?: SentenceAnalysis;
}
/** LLM 预跑出来的句子结构分析。没有时 UI 退回分层模板文案。 */
export interface SentenceAnalysis {
    /** 主句主干，保证是原句的精确子串 */
    skeleton: string;
    modifiers: { text: string; role: string }[];
    grammarRefs: string[];
    gloss: string;
    whyLearn: string;
}
export type SentenceSummary = Pick<Sentence, 'id' | 'lessonId' | 'text' | 'wc' | 'clauses'>;
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
    /** 本课出现的语境释义，去重后集中存放，hit[3] 是下标 */
    glosses?: string[];
    /** 每条语境释义的来源方法，hit[4] 是下标 */
    glossMethods?: string[];
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
    /** 教学点层：教材要教的东西，与语言对象解耦 */
    teachingPoints?: TeachingPoint[];
    quiz?: QuizItem[];
    teachingCoverage?: { total: number; covered: number; rate: number; byKind: Record<string, { total: number; covered: number }> };
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
/** 一课的学习记录。 */
export interface LessonProgress {
    state: 'reading' | 'read';
    /** 首次阅读时间。**0 表示"迁移前就在读，具体时间未知"**——不拿别的时间冒充。 */
    firstReadAt: number;
    lastReadAt: number;
    readCount: number;
    /** 累计看过的句子 id。用于算覆盖率，比"读到第几句"更准（会回看、会跳读）。 */
    visited?: string[];
}

export interface UserData {
    version: 2;
    /** 从哪个版本迁移而来。有值时说明历史阅读记录的时间不可考。 */
    migratedFrom?: number;
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
    lessons: Record<string, LessonProgress>;
}
export const TYPE_LABEL: Record<KPType, string> = { grammar: '语法', pattern: '句型', chunk: '语块', word: '词' };
export const TYPE_ORDER: KPType[] = ['grammar', 'pattern', 'chunk', 'word'];
export const STATE_LABEL: Record<MemoryState, string> = { new: '新卡', learning: '学习中', review: '复习中', relearning: '重新学习' };
export const entityKey = (entity: Entity) => `${entity.kind}:${entity.id}`;
