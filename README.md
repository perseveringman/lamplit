# 灯下 · 阅读星图

一套围绕「选课 → 精读 → 留下知识 → 回到语境复习」组织的新概念英语阅读应用。

**交付状态：依赖安装、严格 TypeScript 检查、Vite 生产构建、真实浏览器 E2E（真实 G6 + 真实 IndexedDB）均已通过。** 数据侧新增了 ECDICT 词典层与「语境释义」层：释义从「词」降到「出现」，并补上了 **832 个语块**与 3,825 句结构分析。边界见下文「诚实边界」一节。

## 先打开看看（不需要 npm install）

需要 Node.js 22.12 或更新的 Node 22 版本。在解压后的 `lamplit` 文件夹运行：

```sh
node scripts/serve.mjs
```

在浏览器打开 `http://127.0.0.1:4173`。按 Ctrl+C 关闭服务。不要双击 HTML 使用 `file://`，因为课文通过同源请求加载。

这个预览使用同一份 React 页面源码的预转译版本，附带本地 React 运行时和 SVG 星图降级渲染；不依赖 CDN、API Key、账号或外部服务。它不是静态截图，阅读、搜索、保存、FSRS 评分和会话返回都可交互。所有记录在浏览器里用 IndexedDB 保存，**只属于当前浏览器与站点地址**。不能自动跨设备同步，清除网站数据会删除记录。

预览内置 React 核心为 18.2.0，ReactDOM 暴露版本为 `18.2.0-next-9e3b772b8-20220608`；正式源码依赖为 18.3.1。这个版本差异是交付环境中缓存运行时的限制，不代表正式构建结果。

## 正式开发 / 构建

```sh
npm install
npm run dev
```

```sh
npm run data:check
npm test
npm run build
npm run preview
```

`npm run build` 先运行严格 TypeScript 项目检查，再运行 Vite。产物会写入 `dist/`，**当前压缩包没有虚构的 dist**。`base: './'` 和 hash 路由允许部署到普通静态目录，不需要后端重写规则。

### 部署注意事项

Shadow Language 主站发布到静态托管根路径 `/` 时不要使用 `--prune`：它会删除本次构建产物中不存在的远端文件，可能连带删除独立发布在 `/lamp` 下的 Lamplit 文件。Lamplit 应单独部署到 `lamp` 子路径。

线上 `/lamp` 由 CloudBase HTTP 云函数 `lampSlashRedirect` 返回 308 到 `/lamp/`；`/lamp/` 映射到 `staticstore` 并启用完整路径透传，使 `assets/`、`data/` 继续从 `lamp` 对象目录读取。调整网关时保留这两条路由和路径透传设置。函数源码位于 `cloudbase/functions/lampSlashRedirect/`。

源码采用 React 18 + TypeScript + Vite + Tailwind 4，组件源文件位于 shadcn/ui 约定的 `src/components/ui/`。Button / Input / Badge / Card 是本地定制适配，包含 `components.json`、语义主题 tokens 和组件变体。Dialog 特意采用原生 `<dialog>`，并非原封不动的 Radix Dialog；这样离线预览也具有模态焦点约束。没有伪造 `shadcn/ui` npm 包依赖。

正式星图在 `KnowledgeGraph.tsx` 动态加载 **`@antv/g6`**。加载失败时保留可交互的 SVG 降级图；手机始终使用按类型分组的邻域列表。**本地免安装预览不包含 G6 包。**

交付环境无法解析 npm registry 域名，安装未完成，所以没有产生 `package-lock.json`。版本已在顶层依赖中固定；首次成功安装后请提交真实 lockfile。没有锁文件不能声称完整的跨机器依赖复现。

## 五分钟体验主流程

1. 首页点「从这一课开始」或「连学」里的课文卡，先查看课文画像，再点「开始精读」。
2. 在第二册第一课点击第 6 句；右侧显示句子详情。点击左侧「一般过去时」，全文定位所有命中处；上下箭头在这些原句之间移动。
3. 给一个知识点点星标，再给一句原句点「保存」。两类卡片会进入同一个「我的卡片」，不是两套复习系统。
4. 开始复习，先回忆，再按空格或按钮翻面。背面的出处可以跳回原句，再点「回到复习」继续，不丢当前会话。
5. 选择「忘记 / 困难 / 记得 / 轻松」。查看真实到期时间、历史统计，或暂停 / 恢复 / 重置 / 删除卡片。

详细检查路径见 `docs/PRODUCT_GUIDE.md`。

## 已提供的内容

| 内容 | 数量 / 范围 |
| --- | --- |
| 课文 | 288 篇；第一至第四册分别 72 / 96 / 60 / 60 |
| 阅读句段 | 4,606；依据源文件行与标点切分，包含对话短句、源文残句 |
| 知识索引 | 8,715：词形 7,741、**语块 832**、句型 92、语法 50 |
| 能力路径 | 25；生存、日常、叙事、读写、思辨五个阶段 |
| 课文共点 | 真实交集最多的 100 对；不是随机连接 |
| 原文命中 | 48,378 个；每个都有来源句 ID 和精确起止位置 |
| 语境释义 | 31,636 次出现各自绑定一个义项（覆盖率 99.6%）|
| 句子结构分析 | **3,825** 句有逐句主干与修饰拆解（占 83.0%）|
| 教学点 | 28 条经两套材料交叉核对的教材事实；11 条已知规则缺口单独记录 |
| 课文导读 | 288 条，课课不同（由 teachingFocus 模板化生成，非聚类默认值）|
| 测验题库 | **1,720** 题覆盖全部 288 课；每题的答案、挖空位置、题干、干扰项、teachingFocus 命中均在 `data:check` 里机械校验 |
| 用户状态 | 重点 / 不熟悉 / 卡片 / 评分 / 阅读位置 / 层开关 / 字号 / 目标保留率 |

**释义来自三层，优先级明确写进代码：** 原文旁注 > 语块 > 词典语境判定（LLM）> 编辑词表单义条目 > 词典首义。
3,573 个词形有人工整理释义，其余由 ECDICT（98.7% 命中）补齐；每个词条的详情卡同时显示**语境义**（这句话里的意思）、**核心义**（词典首义，有出处）、**英文定义**与**词伙**。
语块清单由「类别枚举 + 语料验证」产生，从 275 扩到 **832**，**零死条目**——定义了但语料里从未出现的词条会被 `data:check` 直接判失败。
语块覆盖率（单词命中被语块完整包住、因而由语块承担词义的比例）从 4.4% 升到 **10.4%**。
具体规则与内容质量边界见 [docs/DATA_QUALITY.md](docs/DATA_QUALITY.md)。

## 目录

```text
src/
  components/ui/       本地组件源代码与主题适配
  components/          搜索、实体详情、星图、知识胶囊、高亮
  pages/               星图 / 索引 / 连学 / 共点 / 阅读 / 卡片 / 复习
  lib/                 数据、FSRS、IndexedDB、路由、搜索、高亮
scripts/
  build-data.mjs       从原始 Markdown 重建语料
  editorial.mjs        标题处理、能力路径、阅读主题与画像
  knowledge.mjs        语块、句型、语法规则
  glossary.mjs         可追踪的人工整理释义
  ecdict.mjs           ECDICT 接入层（纯函数解析，可单元测试）
  senses.mjs           语境释义解析：词性过滤 + 语块覆盖 + 原形回退
  verb-forms.mjs       由 ECDICT 生成的动词变形表（勿手工编辑）
  chunk-candidates.mjs 语块候选池（按类别枚举）
  llm-prepare.mjs      LLM 批处理切分
  llm-merge.mjs        LLM 输出合并与机械校验
  check-data.mjs       来源、关系、位置与压缩一致性检查
  serve.mjs            无依赖本地预览服务器
  build-local-preview.mjs   从同一 TSX 重建本地预览
public/data/           可部署的 JSON 和 gzip 静态数据
sources/               原始课文与 SPEC，未改写
preview/               已附带的本地预览；不是 Vite dist
tests/                单元测试、真实环境 E2E、受限环境 UI 测试
docs/                 产品指南、架构、数据审计、测试报告和截图
```

## 常用命令

```sh
npm run data:build        # 重新解析四册，预计算知识、关系和出处
npm run data:check        # 230,245 项结构断言；不是语言学准确率测试
npm test                 # FSRS / 搜索 / 高亮领域测试，不需要安装依赖
npm run preview:local    # 启动已附带的本地预览
npm run preview:rebuild  # 使用已安装的 TypeScript 重新转译本地预览
npm run dict:fetch       # 下载 ECDICT 词典（约 207MB，只需一次）
npm run dict:cache       # 抽取语料用到的词条（98.7% 命中）
npm run chunks:verify    # 校验语块清单：候选必须真的在语料里出现
npm run chunks:forms     # 从 ECDICT 生成动词变形表（174 个动词）
npm run report:senses    # 打印语境释义覆盖率与 A/B/C/D 分层
npm run llm:prepare      # 切分 LLM 批处理任务
npm run llm:merge        # 合并并机械校验 LLM 输出
npm run typecheck        # 需要安装完整依赖
npm run test:e2e         # 真实浏览器 + Vite + G6 + IndexedDB 验收
```

首次执行 E2E 之前运行 `npx playwright install chromium`。`.github/workflows/quality.yml` 已提供，但未在此环境运行。

## 流水线文档

这套流程不是「新概念阅读器」，而是**把任意英文语料加工成语境释义学习数据的流水线**。
新概念只是第一个验证语料，7 个阶段里有 5 个已经完全与语料解耦。

- [docs/pipeline/README.md](docs/pipeline/README.md) —— 7 个阶段的契约、产物与命令
- [docs/pipeline/PRINCIPLES.md](docs/pipeline/PRINCIPLES.md) —— 十条设计原则，含**被否决的方案与理由**
- [docs/pipeline/CORPUS-ADAPTER.md](docs/pipeline/CORPUS-ADAPTER.md) —— 换语料的耦合点清单与迁移路径

## 阅读与复习边界

不包含账号、云同步、AI 翻译、语音评分、笔记编辑、Anki 互通、支付或服务端。没有伪造学习天数、正确率或进度。
单次复习会话是一遍固定到期队列，Again 在 1 分钟后重新到期；当前队列结束后新开会话会重新纳入它，并不会在同一队列中无限循环。

## 诚实边界

- **语境释义不是百分之百准确。** 机械层覆盖 99.6% 的出现，但 ECDICT 常把一个词性下的多个义项打包成一行
  （play 的 `n.` 是「游戏, 游玩, 玩笑, 运动, 比赛…剧本」），机械层切不开时只能取首义。
  这类打包义项词条有 218 个属于高频档，已交给 LLM 批量判定；`tests/golden-senses.json` 里的 `knownGap` 条目就是这类缺口。
- **金标集是回归夹具，不是质量证明。** 它冻结了 12 条手工判定的用例，防止重跑时退化；它不代表整体准确率。
- **句子结构分析由 LLM 预跑，靠三条机械约束兜底**：主干与修饰必须是原句精确子串、角色必须在封闭词表内、语法引用必须是该句已有语法点的子集。违反的条目整条丢弃。
- **源文残缺未修复。** 98 个词形（`andforgive`、`beautif`、`determinded` 这类）是源 Markdown 自身的粘连与拼写问题，词典查不到，也不代写。
- **语块清单只收录语料里真实出现的搭配。** 参考词表里有而新概念四册**一次都没出现**的（`take care of`、`never mind`、`in a hurry`、`in person`、`good luck`、`feel like`、`end up`…）一律不入册。
  这不是保守，是实测：1,435 个候选里 629 个在 65,944 词语料里零命中。硬凑数量只会让"我们覆盖了 N 个语块"这个说法变得不诚实。
- **词表匹配有三处容易踩的坑，都已在代码里处理并加了断言**：ECDICT 的 `be` 变形表缺 `am/are/were`；`am very proud of` 中间夹着副词；候选里的 `one's`/`sb` 在语料里从不字面出现。

版权与第三方来源说明在 `THIRD_PARTY_NOTICES.md`。提供附件文本的处理结果不等于获得其公开传播或商业再授权。
