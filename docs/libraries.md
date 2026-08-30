# 组件库注册表 — Classolo

> 本表是依赖引入的唯一裁判：**每个关注点只有一个所有者**。表外同类库禁止引入；要引入先改表（走 ADR + 用户确认）。
> AI 引入/变更任何依赖前必读本表。所有版本与指标核实于 2026-08-30 联网调研（现场见 `docs/designs/library-showcase/`）。

| 关注点 | 层 | 所有者 | 版本 | 封装层入口 | ADR | lessons |
|---|---|---|---|---|---|---|
| UI 基础组件 | 组件库 | shadcn/ui + radix-ui + Tailwind v4 | shadcn ^3.8.5 | `src/components/ui/` | ADR-0003 | docs/lessons/shadcn.md |
| 设计令牌/主题 | CSS 变量 | StudySolo 令牌；默认跟随系统 | — | `src/styles/tokens.css` + `src/lib/theme/` | ADR-0014 | — |
| 状态管理 | 客户端 store | zustand | ^5.0.11 | 直接使用（豁免封装） | ADR-0003 | — |
| 流式 Markdown/富文本 | 渲染管线 | streamdown + react-markdown 全家 + katex + shiki | streamdown ^2.3.0 | `src/components/markdown/` | ADR-0011 | docs/lessons/streamdown.md |
| 实时语音转文字 | 6 协议族适配器（自研） | `src/lib/providers/asr/`（阶跃/百炼 realtime-ws 默认） | — | `src/lib/providers/asr/` | ADR-0004 | docs/lessons/asr-adapters.md |
| 思维导图渲染 | 通用节点图 + 自动布局 | @xyflow/react + @dagrejs/dagre | ^12.11.5 / ^3.1.1 | `src/components/mindmap/` | ADR-0005 | docs/lessons/xyflow.md |
| Agent 框架 | 单 Agent 工具调用层 | ai（Vercel AI SDK）+ @ai-sdk/openai-compatible | ^7.0.84 | `src/lib/ai/` | ADR-0006 | docs/lessons/ai-sdk.md |
| 本地数据库 | 内嵌 Postgres | @electric-sql/pglite + drizzle-orm | ^0.5.8 / 1.0.0-rc.4 | `src/lib/db/` | ADR-0007 | docs/lessons/pglite.md |
| 可拖拽分屏 | resizable panel | react-resizable-panels（经 shadcn Resizable） | ^4.12.3 | `src/components/layout/` | ADR-0008 | docs/lessons/resizable-panels.md |
| 桌面打包 | Electron | electron + electron-builder + electron-updater | builder @26 | `electron/`（打包阶段引入） | ADR-0009 | docs/lessons/electron.md |
| 渲染区组件协议 | 自研协议（CRP） | `src/features/render-modules/` | — | 同左 | ADR-0010 | — |
| Schema 校验 | 运行时校验 | zod | ^4 | 直接使用（豁免封装） | ADR-0006 | — |
| 图标 / 通知 / 动画 / 字体 | 生态沿用 | lucide-react / sonner / framer-motion / @fontsource-variable | 见 package.json | 直接使用（豁免封装） | ADR-0011 | — |
| 遗忘曲线（P1 预研） | SRS 算法 | 候选 ts-fsrs，未选型 | — | — | 待 P1 调研 | — |

## 互斥禁令（写给 AI 的具体措辞）

- 思维导图 = @xyflow/react + dagre，**禁止引入 markmap / mind-elixir / simple-mind-map / jsmind / elkjs（copyleft）/ d3-flextree（停更）**
- Agent = Vercel AI SDK，**禁止引入 pi（@earendil-works/*）/ Mastra / LangGraph.js / @openai/agents**；pi 只允许借鉴其上下文工程实践，不进依赖树
- 本地数据 = PGlite + Drizzle，**禁止引入 better-sqlite3 / node:sqlite / Dexie / localforage / Prisma**
- 分屏 = react-resizable-panels，**禁止引入 allotment / dockview / flexlayout-react / react-split**
- 状态 = zustand，**禁止引入 redux / jotai / valtio / mobx**
- Markdown 渲染 = streamdown 管线，**禁止引入 marked / markdown-it 另起炉灶**
- 动画 = framer-motion，**禁止引入 GSAP / react-spring / animejs**
- 通知 = sonner，**禁止引入 react-hot-toast / react-toastify**
- HTTP = 原生 fetch，**禁止引入 axios / ky**
- ASR = 自研协议族适配器，**禁止为单一厂商引入官方 npm SDK**（多数已停更，协议以官方 WS/REST 文档为准）
- 部署 = 无云部署（Electron 本地），**禁止引入任何 EdgeOne / Vercel / Netlify 专属配置**

## 内联与原生清单（不需要库的部分）

- 录音采集 → 原生 MediaRecorder / Web Audio API（AudioWorklet 重采样）
- Gen UI → 自研受控 DSL + 白名单组件（走 CRP 渲染协议，禁止 AI 生成任意代码执行）
- 图片检索 → API Provider（设置页配置来源），非组件库
- debounce/throttle 等小工具 → `src/lib/utils.ts` 自写
- 弹层定位 → 优先 radix primitives，简单场景原生 Popover API

## 变更规则

新增关注点或更换所有者：联网核实候选（七项硬指标）→ 用户拍板 → 写 ADR → 更新本表 → 建对应 lessons 文件。
