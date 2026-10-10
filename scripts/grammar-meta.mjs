/**
 * 语法规则的英文术语与结构公式。
 *
 * 这两项都是**标准语法学术语与结构描述**，由本项目自撰，不取自任何教辅材料
 * （原则 11：外部材料只采信事实，不自撰表述；术语本身是公共知识，不需要采信）。
 *
 * 难度**不另造量表**，直接由 introduceBook（教材事实，见 book-roles.mjs）派生：
 *   1 册 → basic / 2 册 → intermediate / 3 册 → upper / 4 册 → advanced
 * 没有引入册依据的规则 level 为 null——不猜。
 */

/** kpId → { en: 英文术语, formula: 结构公式 } */
export const GRAMMAR_META = {
  'g-present':                { en: 'simple present',            formula: 'do / does + 动词原形；第三人称单数加 -s' },
  'g-past':                   { en: 'simple past',              formula: '动词过去式（规则 -ed，不规则需记）' },
  'g-future':                 { en: 'simple future',            formula: 'will + 动词原形' },
  'g-present-continuous':     { en: 'present continuous',       formula: 'am / is / are + 现在分词' },
  'g-past-continuous':        { en: 'past continuous',          formula: 'was / were + 现在分词' },
  'g-present-perfect':        { en: 'present perfect',          formula: 'have / has + 过去分词' },
  'g-past-perfect':           { en: 'past perfect',             formula: 'had + 过去分词' },
  'g-future-perfect':         { en: 'future perfect',           formula: 'will have + 过去分词' },
  'g-future-continuous':      { en: 'future continuous',        formula: 'will be + 现在分词' },
  'g-perfect-continuous':     { en: 'perfect continuous',       formula: 'have / has / had been + 现在分词' },
  'g-future-in-past':         { en: 'future in the past',       formula: 'would / should + 动词原形' },
  'g-going-to':               { en: 'be going to',              formula: 'am / is / are going to + 动词原形' },
  'g-used-to':                { en: 'used to',                  formula: 'used to + 动词原形' },
  'g-passive':                { en: 'passive voice',            formula: 'be + 过去分词（+ by 施动者）' },
  'g-modal':                  { en: 'modal verbs',              formula: '情态动词 + 动词原形' },
  'g-deduction':              { en: 'modals of deduction',      formula: 'must / can’t / may / might (+ have + 过去分词)' },
  'g-subjunctive-past':       { en: 'subjunctive / unreal past',formula: 'if + 过去式 / had + 过去分词，主句用 would' },
  'g-double-negative':        { en: 'double negative',         formula: 'not + un-/in-/dis- 形容词；never fail to；cannot … without；no … without' },
  'g-parenthesis':            { en: 'parenthesis',             formula: '主语 + , + 插入成分 + , + 谓语' },
  'g-wish-clause':            { en: 'wish + past subjunctive',  formula: 'wish + 过去式 / had + 过去分词' },
  'g-question':               { en: 'yes–no question',          formula: '助动词 / be 提前至句首' },
  'g-wh-question':            { en: 'wh-question',              formula: '疑问词 + 助动词 + 主语 + 动词' },
  'g-indirect-question':      { en: 'indirect question',        formula: '疑问词 / if / whether + 陈述语序' },
  'g-tag':                    { en: 'question tag',             formula: '陈述句 + 相反极性的助动词 + 代词' },
  'g-negation':               { en: 'negation',                 formula: '助动词 / be + not' },
  'g-imperative':             { en: 'imperative',               formula: '动词原形开头；否定用 Don’t' },
  'g-exclamation':            { en: 'exclamation',              formula: 'What + 名词 / How + 形容词 + 主谓' },
  'g-existential':            { en: 'existential there',        formula: 'There + be + 名词 + 地点' },
  'g-possession':             { en: 'possessive',               formula: '名词 + ’s；或 of 短语；或物主代词' },
  'g-quantity':               { en: 'quantifiers',              formula: 'some / any / many / much / a few / a little' },
  'g-comparative':            { en: 'comparative',              formula: '-er / more + 形容词 + than' },
  'g-superlative':            { en: 'superlative',              formula: 'the + -est / most + 形容词' },
  'g-relative':               { en: 'relative clause',          formula: 'who / which / that / whose / whom / where + 从句' },
  'g-appositive-clause':      { en: 'appositive clause',        formula: '抽象名词 + that + 完整从句' },
  'g-object':                 { en: 'object clause',            formula: '动词 / 形容词 + that / 疑问词 + 从句' },
  'g-time':                   { en: 'adverbial clause of time', formula: 'when / while / before / after / as soon as + 从句' },
  'g-cause':                  { en: 'adverbial clause of reason',formula: 'because / since / as + 从句' },
  'g-condition':              { en: 'conditional clause',       formula: 'if / unless + 从句，主句（主将从现）' },
  'g-concession':             { en: 'concessive clause',        formula: 'although / though / even if / no matter + 从句' },
  'g-manner-clause':          { en: 'adverbial clause of manner',formula: 'as if / as though + 从句' },
  'g-place-clause':           { en: 'adverbial clause of place',formula: 'where + 从句' },
  'g-purpose':                { en: 'purpose and result',       formula: 'so that / so … that / such … that / to' },
  'g-coordination':           { en: 'coordination',             formula: 'and / but / or / so 连接对等成分' },
  'g-cleft':                  { en: 'cleft sentence',           formula: 'It is / was … that …；或 What … is …' },
  'g-inversion-negative':     { en: 'negative inversion',       formula: '否定词置句首 → 助动词提前' },
  'g-inversion-only':         { en: 'inversion after only',     formula: 'Only + 状语置句首 → 主句助动词提前' },
  'g-inversion-locative':     { en: 'locative inversion',       formula: '地点 / 方向状语置句首 → 动词 + 主语（完全倒装）' },
  'g-participle':             { en: 'participle clause',        formula: '现在分词（主动）/ 过去分词（被动）+ 主句' },
  'g-participle-attribute':   { en: 'past participle as attribute', formula: '名词 + 过去分词（+ by / in / from）' },
  'g-absolute-construction':  { en: 'absolute construction',    formula: '名词 / 代词 + 分词 / 不定式 / 介词短语，独立于主句' },
  'g-gerund':                 { en: 'gerund after preposition', formula: '介词 + 动词 -ing' },
  'g-infinitive':             { en: 'infinitive',               formula: 'to + 动词原形（或省略 to）' },
};

const LEVEL_BY_BOOK = { 1: 'basic', 2: 'intermediate', 3: 'upper', 4: 'advanced' };

/**
 * 规则的展示元数据。没有引入册依据时不给 level——猜出来的难度会污染排序与筛选。
 * 句型的英文名已在 name 里（如 "Is this …?"），只需给 level。
 */
export function metaOf(kpId, type, introduceBook) {
  const m = type === 'grammar' ? GRAMMAR_META[kpId] : null;
  return {
    enName: m ? m.en : null,
    formula: m ? m.formula : null,
    level: introduceBook ? (LEVEL_BY_BOOK[introduceBook] ?? null) : null,
  };
}
