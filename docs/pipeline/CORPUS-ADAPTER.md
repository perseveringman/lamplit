# 脱离新概念：语料适配器

**目标**：任意英文课文语料进来，按同一套流程重建一份可用的数据集——
词典层、语块层、语境释义层、LLM 增强层、验证层全部复用，只换「语料接入」和「编辑层」。

现状：7 个阶段里 **5 个已完全解耦**，2 个仍硬编码绑定新概念。本文给出耦合清单与迁移路径。

---

## 一、耦合清单

图例：✅ 通用 · 🔧 需参数化 · ❌ 绑死新概念

| 位置 | 耦合内容 | 判定 |
|---|---|---|
| [`build-data.mjs:13`](../../scripts/build-data.mjs) | `filenames` 硬编码 4 个新概念文件名 | ❌ |
| [`build-data.mjs:95`](../../scripts/build-data.mjs) | 标题正则 `^## Lesson\s+(\d+)(?::\s*(.*))?$` | ❌ |
| [`build-data.mjs:100`](../../scripts/build-data.mjs) | `titles1` / `titles3` 标题修正表（第一、三册专用） | ❌ |
| [`build-data.mjs:154`](../../scripts/build-data.mjs) | `primary[b+1]?.[i]` 课程→能力路径的硬编码映射表 | ❌ |
| [`build-data.mjs:169`](../../scripts/build-data.mjs) | `headings.length !== [72,96,60,60][b]` 硬断言 | ❌ |
| [`build-data.mjs:163`](../../scripts/build-data.mjs) | `genre` 用 `cluster.stage === '思辨'` 判定 | ❌ |
| [`build-data.mjs:198`](../../scripts/build-data.mjs) | `for (let b = 1; b <= 4; b++)` 固定四册 | 🔧 |
| [`build-data.mjs:216`](../../scripts/build-data.mjs) | `defaultKP:'g-past'` / `defaultLesson:'b2-001'` / `contentVersion:'nce-source-v1'` | ❌ |
| [`build-data.mjs:108`](../../scripts/build-data.mjs) | 句子分档阈值 `wc>=32 \|\| (wc>=23 && subordinate>=2)` | 🔧 |
| [`editorial.mjs`](../../scripts/editorial.mjs) | 25 条能力路径 + 关键词、bookMeta、primary、featured —— 全部按新概念编写 | ❌ |
| [`glossary.mjs`](../../scripts/glossary.mjs) | 3,573 条人工整理释义，按新概念课文词表编写 | ❌ |
| [`check-data.mjs:17,18,21`](../../scripts/check-data.mjs) | `288 课` / `[72,96,60,60]` / 第四册重复 Lesson 27 | ❌ |
| [`knowledge.mjs`](../../scripts/knowledge.mjs) 的 72 条语法规则 | 规则本身是英语通用的，但阈值按新概念调过 | 🔧 |
| [`knowledge.mjs`](../../scripts/knowledge.mjs) 的 806 条语块 | **已经是「候选枚举 + 语料验证」的产物，可移植** | ✅ |
| 前端 `lesson.book === 4` 判定中文标题 | 四册假设 | 🔧 |
| `tier` 名称（范句 / 长难句 / 例句） | 概念通用，命名耦合 | ✅ |

**已经完全通用、一行不用改的模块：**

```
scripts/ecdict.mjs           词典解析（纯函数）
scripts/senses.mjs           语境消歧引擎
scripts/build-dict-cache.mjs 词典抽子集
scripts/build-verb-forms.mjs 变形表生成
scripts/verify-chunks.mjs    语块验证
scripts/report-senses.mjs    覆盖率报告
scripts/llm-prepare.mjs      LLM 批次切分
scripts/llm-merge.mjs        LLM 合并与机械校验
scripts/fetch-dict.mjs       ECDICT 下载
tests/sense.test.ts          解析单元测试
```

---

## 二、适配器接口

把「语料接入」抽象成一个函数：

```js
/**
 * @param {string} inputDir  原始文本所在目录
 * @returns {CorpusSource}
 */
export function parseCorpus(inputDir) { /* ... */ }
```

### 必需字段

```js
{
  id: 'nce',                       // 语料标识，用于 contentVersion
  contentVersion: 'nce-source-v1', // 变了就让缓存失效

  books: [
    { id: 1, roman: 'I', en: 'First Things First', zh: '第一册' },
    // ...
  ],

  lessons: [{
    id: 'b2-001',                  // 全局唯一、稳定
    book: 2,
    sequence: 1,                   // 册内顺序，用于课间导航
    no: 1,                         // 原书课号（可重复）
    label: 'II · 01',              // 展示用短标签
    title: 'A private conversation',
    titleZh: '私人谈话',
    titleOrigin: 'source',         // 'source' | 'editorial-label' | 'editorial-theme'
    sourceFile: 'new-concept-english-book-ii(2).md',
    sourceLine: 13,
    sourceEndLine: 35,
    sourceHeading: 'A private conversation 私人谈话',
    blocks: [                      // 切好的块，heading 与 body 分开
      { text: '...', line: 13, kind: 'heading', offset: 0 },
      { text: '...', line: 15, kind: 'body',    offset: 128 },
    ],
    quality: ['原文件标题与首句相连；此处保留可见内容。'],
  }],

  defaults: { kp: 'g-past', lesson: 'b2-001' },
}
```

**关键约束（不可妥协）**：`blocks` 里的每一个字符都必须能映射回源文件的精确位置。
`build-data.mjs` 会用它算出 `sourceStart`，`data:check` 会逐句验证可还原性。

### 可选字段（编辑层）

有则用，没有则走通用默认值：

```js
{
  clusters: [...],                    // 能力路径
  primary: { 2: ['travel', 'food', ...] },  // 第 N 册的 课程顺序 → 路径 id
  titles:  { 1: ['A new dress', ...] },     // 标题修正表（解决标题与首句粘连）
  featured: { 'b2-001': { scene, canDo, summary, focus } },
  tierThresholds: { complexWc: 32, complexSubordinate: 2, modelMin: 4, modelMax: 25 },
}
```

---

## 三、通用默认值：没有编辑层也要能跑出可用的东西

新概念那套能力路径、场景、canDo 是**编辑性内容**，不是流程必需的。
没有它们时，用以下通用规则补齐，保证产出一份能用的应用：

### 1 · 能力路径（clusters）→ 从共点图自动聚类

流程里**已经算好了「课文共点」**——289 课两两之间的共享知识点数。
这就是一张现成的相似度图：

```
1. 取共点数 ≥3 的课文对构成边
2. 跑一次社区发现（Louvain / 标签传播）
3. 每个社区 = 一条能力路径，名字取社区内最高频的 2–3 个知识点
```

新概念上这条路径会得到约 6–8 个簇，而人工编辑是 25 条。
**精度更低，但结构是对的**，而且完全自动。

没有图算力时，退化成：**按册分路径**（`第 N 册`）或**单一「全部课文」路径**。

### 2 · 句子分档阈值 → 改用百分位

现在是绝对词数（`wc>=32`），这是按新概念句子长度调的。改成：

```
complex  = 词数在前 8%  或  (词数 ≥ p75 且 从句线索 ≥2)
model    = 命中了句型  且  词数在 [4, p60]
example  = 其余
```

百分位自适应任何语料。

### 3 · 体裁判定 → 用标点与连接词画像

现在用 `cluster.stage === '思辨'`（依赖人工路径）。改成纯文本特征：

| 特征 | 判定 |
|---|---|
| 引号与 `Question` 密度高 | 对话 |
| `because / therefore / thus` 密度高 | 议论 / 说明 |
| 过去时 + 时间状语密度高 | 叙事 |
| 其余 | 说明 |

### 4 · 默认入口 → 取连通度最高的知识点与第一篇课文

不要把 `g-past` 和 `b2-001` 写死。改成数据驱动：

```js
defaultKP = catalog.kps 里 degree 最高的那个
defaultLesson = books[0].lessons[0].id
```

### 5 · 标题与首句粘连 → 从「修表」改成「规则 + 标注」

`titles1` / `titles3` 是人工看过 132 课写出来的修正表。通用做法：

```
若标题行的长度 > 65 或包含句末标点 → 判定为「标题与首句粘连」
  → 取第一个句子边界之前的部分作标题
  → 其余作为首句
  → 无法可靠切分时，标题退回 `Lesson {no}` 并在 quality[] 里标注
```

**新概念上仍应保留人工修正表**——它是更高质量的结果。但通用路径不能依赖它。

---

## 四、最小可用适配器：纯文本目录

第一个要实现的适配器，因为最容易验证：

```
inputDir/
  lesson-001.txt
  lesson-002.txt
  ...
```

```js
export function parsePlainTextDir(inputDir) {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt')).sort();
  return {
    id: 'plain',
    contentVersion: 'plain-v1',
    books: [{ id: 1, roman: 'I', en: '', zh: '' }],
    lessons: files.map((file, i) => {
      const raw = fs.readFileSync(path.join(inputDir, file), 'utf8');
      const lines = raw.split(/\r?\n/);
      const [first, ...rest] = lines;
      return {
        id: `b1-${String(i + 1).padStart(3, '0')}`,
        book: 1,
        sequence: i + 1,
        no: i + 1,
        label: String(i + 1).padStart(2, '0'),
        title: first.trim() || `Lesson ${i + 1}`,
        titleZh: '',
        titleOrigin: 'source',
        sourceFile: file,
        sourceLine: 1,
        sourceEndLine: lines.length,
        sourceHeading: first.trim(),
        blocks: [
          { text: first, line: 0, kind: 'heading', offset: 0 },
          ...splitParagraphs(rest, first.length + 1),
        ],
        quality: [],
      };
    }),
    defaults: {},   // 由 build-data 数据驱动地填
  };
}
```

接上这个适配器，**词典层到验证层的全部 6 个阶段无需任何改动**。

---

## 五、迁移路径

每一步都可独立验证，不需要等全部做完。

### 第 1 步 · 抽出适配器接口（不改行为）

- 新建 `scripts/corpus/nce.mjs`，把 `build-data.mjs` 里的解析逻辑搬进去
- `build-data.mjs` 改成 `import { parseCorpus } from './corpus/nce.mjs'`
- **验收**：`data:check` 与 `npm test` 数字完全不变

这是纯重构，风险最低，且立刻把「语料接入」隔离成一件事。

### 第 2 步 · 编辑层外部化

- 把 `clusters` / `bookMeta` / `primary` / `titles` / `featured` 从 `editorial.mjs`
  搬进 `corpora/nce/editorial.json`
- `build-data.mjs` 从适配器的可选字段读取，缺失时走通用默认值
- **验收**：数字不变；再把编辑层文件临时改名，确认能靠默认值跑出一份产物

### 第 3 步 · 通用默认值实现

- 共点图聚类 → clusters
- 百分位分档 → tier
- 标点画像 → genre
- 数据驱动 → defaults
- **验收**：用纯文本目录跑一遍，`data:check` 通过（语料特定的断言需同步参数化）

### 第 4 步 · 断言参数化

`check-data.mjs` 里 `288` / `[72,96,60,60]` / 重复 Lesson 27 这类断言，
改成从适配器读期望值：

```js
check(lessons.length === source.expectedLessonCount, '语料课程数');
check(source.duplicateNumbers.every(n => lessons.filter(l => l.no === n).length === 2), '保留重复课号');
```

### 第 5 步 · 前端去四册假设

- `lesson.book === 4` 判中文标题 → 改成 `lesson.titleOrigin === 'editorial-theme'`
- 册别筛选器改成从 `catalog.books` 动态生成
- **验收**：`npm run test:e2e` 在纯文本语料上同样 4/4

---

## 六、已知难点与开放问题

| 问题 | 现状 | 建议 |
|---|---|---|
| **能力路径的质量** | 人工 25 条 vs 自动聚类约 6–8 条 | 自动结果结构正确但粒度粗；可以先自动，再人工补几条 |
| **glossary 无法移植** | 2,688 行按新概念词表写的 | **不需要移植**——词典层已经覆盖 98.7%，glossary 只是"更准的那一层"。新语料可以没有它 |
| **语法规则阈值** | 72 条规则的量词范围（`[^.!?]{2,55}`）按新概念句子长度调过 | 换成相对长度（句子的百分比）而非绝对字符数 |
| **语块清单的可移植性** | 806 条是「通用英语参考词表 ∩ 新概念语料」 | 换语料要**重跑 `chunks:verify`**——参考词表复用，存活集合重算 |
| **重复课号 / 版本混杂** | 新概念第四册有两个 Lesson 27 | 这是语料特性，不该由通用流程假设；交给适配器声明 |
| **语料规模差异** | 65,944 词是「一本短篇小说」的量级 | 更大语料（如 Gutenberg 全书）会让命中数、批次数量级上升；LLM 批次需分片 |
| **版权** | 新概念版权未获再分发授权，仅自用 | **换语料时这是首要问题**：Gutenberg / VOA / 自建语料无此约束 |

---

## 七、为什么这套流程值得脱离语料

它不是「新概念阅读器」，而是**把任意英文语料加工成语境释义学习数据的流水线**。
新概念只是第一个验证语料，而且验证得相当充分：

```
语境释义覆盖率   99.6%
语块             806 条，死条目 0
LLM 接受率       8,553 + 815 条，拒绝 1
数据断言         222,009 项通过
测试             28 / 28
真实浏览器 E2E   4 / 4
```

**换语料时，这七项指标仍然成立**——因为它们衡量的是流程本身，不是新概念。
