# 灯下 · 阅读星图

一套围绕「选课 → 精读 → 留下知识 → 回到语境复习」组织的新概念英语阅读应用。

**交付状态：应用源码、全部附件语料、数据流水线、可直接运行的本地预览、测试和产品验收文档已提供。正式 npm 依赖安装 / 完整 TypeScript 类型检查 / Vite 生产构建 / 实际 AntV 引擎尚未完成环境内验收。** 具体证据在 `docs/TEST_REPORT.md`，不要把本地预览当成已经验收的 Vite 构建产物。

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
| 知识索引 | 8,088：词形 7,741、语块 275、句型 32、语法 40 |
| 能力路径 | 25；生存、日常、叙事、读写、思辨五个阶段 |
| 课文共点 | 真实交集最多的 100 对；不是随机连接 |
| 原文命中 | 44,452 个；每个都有来源句 ID 和精确起止位置 |
| 用户状态 | 重点 / 不熟悉 / 卡片 / 评分 / 阅读位置 / 层开关 / 字号 / 目标保留率 |

**索引数量不是经过逐条人工校订的词汇量。** 7,741 是语料词形，含变形和专名；3,573 个词形有人工整理释义或原文旁注，4,168 个只给真实出处与语境，不伪造释义。语法命中、句子分档、从句线索为可检查的规则结果，不是句法树或权威教材注释。具体规则与内容质量边界见 `docs/DATA_QUALITY.md`。

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
npm run data:check        # 212,612 项结构断言；不是语言学准确率测试
npm test                 # FSRS / 搜索 / 高亮领域测试，不需要安装依赖
npm run preview:local    # 启动已附带的本地预览
npm run preview:rebuild  # 使用已安装的 TypeScript 重新转译本地预览
npm run typecheck        # 需要安装完整依赖
npm run test:e2e         # 真实浏览器 + Vite + G6 + IndexedDB 验收
```

首次执行 E2E 之前运行 `npx playwright install chromium`。`.github/workflows/quality.yml` 已提供，但未在此环境运行。

## 阅读与复习边界

不包含账号、云同步、AI 翻译、语音评分、笔记编辑、Anki 互通、支付或服务端。没有伪造学习天数、正确率或进度。单次复习会话是一遍固定到期队列，Again 在 1 分钟后重新到期；当前队列结束后新开会话会重新纳入它，并不会在同一队列中无限循环。

版权与第三方来源说明在 `THIRD_PARTY_NOTICES.md`。提供附件文本的处理结果不等于获得其公开传播或商业再授权。
