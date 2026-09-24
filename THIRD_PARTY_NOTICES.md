# 第三方与内容来源

## 附件内容

`sources/SPEC.md` 与四册课文由用户提供；源文件中的来源说明保留。`public/data/` 为这些附件的解析结果与本项目新增的阅读组织 / 注解。课文版权仍归相应权利人，本项目没有确认或授予教材公开再分发、出版或商业授权。历史性课文观点和数据不代表当前事实。

## React / ReactDOM / Scheduler

正式源码声明 React / ReactDOM 18.3.1。`preview/vendor.js` 单独保留了环境中已有的 React 18.2 系生产运行时，用于不依赖网络的本地检查。React 核心报告 18.2.0，ReactDOM 报告 `18.2.0-next-9e3b772b8-20220608`。该预览版本与正式依赖不同。

React、ReactDOM、Scheduler：Copyright (c) Facebook, Inc. and its affiliates. MIT License。下方 MIT 许可文本适用。

## FSRS

`src/lib/fsrs.ts` 的记忆模型公式与默认权重依据：

https://github.com/open-spaced-repetition/fsrs4anki/blob/724a2f445adfffb2cc3d7fae7a96ab37b948561c/fsrs4anki_scheduler.js

FSRS4Anki 6.1.1，Copyright (c) 2022 open-spaced-repetition，MIT License。应用学习步长、弱项先验、队列与 UI 为本地适配。本项目未复制 Anki 应用。

## shadcn/ui 源码模式与适配

https://ui.shadcn.com/docs

组件遵循其公开源文件分发、组合接口、主题与变体方式。本项目的 Button / Input / Badge / Card 是本地适配；原生 Dialog 是项目自己的实现，非 Radix Dialog 的原样拷贝。没有把一个不存在的 `shadcn/ui` npm 依赖放进 package.json。

shadcn/ui，Copyright (c) 2023 shadcn，MIT License。保留此来源与许可说明用于源码适配的归属。

## 其他声明依赖

正式安装的 AntV G6、Vite、TypeScript、Tailwind CSS、React Vite 插件、类型包和 Playwright 分别遵循各自随包附带的 LICENSE。没有把未安装的包内容伪装成已捆绑依赖。本项目图标由本项目 SVG 路径绘制；使用系统字体栈，没有附带任何系统字体文件。

## MIT License（上述 MIT 组件）

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
