# 架构与维护

## 静态内容与用户状态分离

原始 Markdown → 离线数据构建 → JSON / gzip → 浏览器只读内容仓库。

用户动作 → StoreProvider → 单个 IndexedDB 读写事务 → 更新 React 状态 → BroadcastChannel 通知同源标签页。

没有数据库服务、登录、LLM 在线调用或后台定时任务；应用运行不会产生模型请求费用。静态托管仍可能产生正常带宽费用。

## 内容模型

Lesson 是学习锚点。每个 Sentence 保留原文件行号、来源块、来源块内偏移与本句文字。Hit 是 `[knowledgeId,start,end]`，位置以 JavaScript UTF-16 code units 计，与 `String.slice` 一致。Occurrence 索引反向存储 `[sentenceId,start,end]`。同一个知识点所有出现处都能回溯，不只留一条例句。

KP 的类型只允许 word / chunk / pattern / grammar。词形保留 lemma 线索，但不把词形数当成词族数。parent / contains 是显式层级或包含关系；related 表示共同出现在课文里的学习关联，不声称同义或反义。

课号可能重复，所以 ID 使用「册 + 源文件内顺序」，不是仅用标题或课号。第四册两个 Lesson 27 保留为两个不同实体。课间导航按源文件顺序。

## 读取与性能

`catalog.json.gz` 约 616KB，包含目录、知识和预计算邻域。各册课文按需读取，句子全局搜索索引与卡片出处分开加载。出处按知识 ID 哈希分成 32 个桶。相同请求复用 promise；失败清理缓存，重试不会永远复用失败结果。

G6 仅在非手机图形视图加载。图使用小规模确定性布局，不把八千个知识节点放进力导向模拟。G6 失败后使用可交互 SVG；手机完全不加载图引擎。课文共点在构建时预计算，不让前端实时做所有课文对的交集。

`DecompressionStream` 可用时读取独立 `.json.gz`，解压后解析；否则读取 `.json`。静态部署不能把 `.gz` 文件错误当作文本，也不需要强行附加 Content-Encoding，应用会自行解压。普通 JSON 保留为兼容回退。

移动首屏 4G 小于 3 秒属于待测目标，不是本次已证明结果。此次未跑实际网络限速性能验收。

## 高亮

对所有活动 span 做边界扫描，再按分段覆盖关系组合展示，避免嵌套字符串替换导致标签错乱。拼接每段 text 必须等于源句。语法背景、语块下划线、句型左标记、词状态、衔接提示可以重叠存在。重点 / 不熟悉即使对应类型层关闭也保留；用户状态优先于默认层。

## 状态与一致性

`lamplit-reader-v1` 只存用户状态，不复制整份语料。版本未知的数据拒绝覆盖。star 与自动建卡在同一事务，grade 与调度更新、日志追加、会话游标推进也在同一事务。写入队列串行执行，跨标签页读取按 revision 比较；旧 revision 不覆盖新值。

队列按到期时间排序，暂停卡不进入队列。会话在跳回原文或暂时离开时保留。批量删除 / 暂停会清理尚未评分的队列部分，已经评分的前缀不重新计分。卡片删除保留历史统计；重置保留 createdAt 与历史评分。

当前采用一个状态记录的事务式快照，适合个人中小型学习库；它不是无限规模方案。复习历史增长到十万级时，下一步应把 cards / reviews / session 拆成独立 object stores，仍用跨 store 事务提交。此版未实现自动日志清理或云端备份。

`uniqueId` 优先使用 `crypto.randomUUID`，普通 HTTP 局域网环境回退到 `crypto.getRandomValues` 生成 UUID，避免因非安全上下文缺少 randomUUID 而无法开始会话。

## FSRS

使用 FSRS4Anki 6.1.1 所公开的 FSRS-6 记忆模型与 21 个默认参数。代码出处 commit：`724a2f445adfffb2cc3d7fae7a96ab37b948561c`。本地实现不是 SM-2 改名，也不依赖伪造的算法包。

本项目额外定义：Again 为 1 分钟；学习 / 重新学习期 Hard 为 10 分钟；Good / Easy 根据稳定度、难度和目标保留率给出天间隔；新卡有不熟悉标记时使用较低初始稳定度；默认目标保留率 90%，可改 75%–97%；fuzz 关闭；新卡 Good 直接进入复习期。

一遍会话不自动追加刚评分的 Again，结束后当它再次到期，可以启动下一次会话。修改目标保留率仅影响之后评分，不批量追溯改写所有既有到期日。用户刚保存的卡片使用实时上下文，不是冻结的原文副本。

## UI 组件与构建

shadcn/ui 风格的源文件组件与语义 tokens 均由项目拥有，Button / Input / Badge / Card 经过本地适配。Dialog 采用原生元素提供 modal 行为，而非 Radix 版本。`components.json` 保留 Vite / Tailwind / alias 配置；以后 CLI 新增组件时，先检查依赖与主题，不要盲目覆盖已适配文件。

正式 Vite 构建与免安装预览是两条不同路径。正式构建使用 package.json 中 React 18.3.1 和真实 G6；预览使用缓存的 React 18.2 系运行时与相同源码的 CommonJS 转译包，G6 走 SVG 回退。测试报告严格区分两条路径。

## 技术参考

- G6 Quick Start：https://g6.antv.antgroup.com/en/manual/getting-started/quick-start
- shadcn/ui Introduction：https://ui.shadcn.com/docs
- shadcn/ui Vite：https://ui.shadcn.com/docs/installation/vite
- Vite 6.4.1：https://github.com/vitejs/vite/releases/tag/v6.4.1
- FSRS 原始实现：https://github.com/open-spaced-repetition/fsrs4anki/blob/724a2f445adfffb2cc3d7fae7a96ab37b948561c/fsrs4anki_scheduler.js

以上是实现参考；课文内容依据 sources 中的用户附件，不从网络补写。
