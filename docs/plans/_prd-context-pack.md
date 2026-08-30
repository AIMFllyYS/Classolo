# PRD 上下文包

> 给后续 PRD 作者的只读备忘录。**不是 PRD**。事实均指向仓库路径；实现以代码为准，决策以 ADR/spec 为准。
> 汇编日：2026-08-30。仓库根：`Classolo/`。

**读法**：已拍板 = ADR/spec/roadmap 已 Accepted，PRD 不得写反。骨架 = 目录/类型/工厂已占位。空 = 文件或目录尚不存在。

---

## 产品与 Demo 停点

| 项 | 定案 | 出处 |
|---|---|---|
| 产品 | 本地优先 AI 课堂工作台：实时录音转写、AI 思维导图笔记、协议化双渲染区、课堂 Agent（对话 + 静默） | `docs/adr/0001-project-scope.md` |
| 域名 / 端口 | `classolo.1037solo.com`（生态预留）；dev **4070** | ADR-0001；`package.json` `dev`/`start` |
| 终端 | 电脑优先、平板其次、**不做手机**（`html { min-width: 768px }`） | ADR-0001；`src/styles/base.css` |
| 栈 | Next.js App Router + `output:'export'` + Electron 桌面 exe（P0 后期）；Windows PowerShell + pnpm | ADR-0001；`next.config.ts` |
| P0 不做 | 云同步、多设备、录音保存/资源库/复习站/测试站、生态 SSO/Supabase/邮件/宝塔 Web | ADR-0001；`docs/plans/roadmap-p0-p1-p2.md` |

**Demo 停点（已拍板，压过「P0 含 Electron」的字面）**

- 验收面 = **浏览器 `localhost:4070` 跑通一节课**。不要求打出 Electron exe。
- 上课关键路径 = **一家 `realtime-ws` + env key**。其余 P0 适配器（`transcriptions-rest`、`local-engine`）仍属 P0 范围，**不在 Demo 关键路径**。
- P0 路线图里的 Electron 打包、45–90 分钟写入压测、三适配器齐套，是 **P0 工程目标**，不是 Demo 闸门。

路线图 P0 验收原文仍写「45 分钟课不丢字 / 导图不闪 / 静默 Agent 触发图与补充 / 除自配 API 外无网络」——PRD 应把 **Demo 最小路径** 与 **P0 全量验收** 分成两档，勿混成「没 exe 就不算 P0」。出处：`docs/plans/roadmap-p0-p1-p2.md`。

---

## 模块地图（features / lib / app）

依赖方向：`app → features → lib`。**features 禁止横向 import**；跨域只经 `src/lib/session/`（ADR-0017）。路由只组装，业务在 features。目录规划：`docs/conventions/project-structure.md`、`docs/designs/architecture-overview.md`。

### `src/app/`（封闭静态路由，ADR-0012 / `docs/conventions/routing.md`）

| 路径 | 阶段 | 代码现状 |
|---|---|---|
| `/` | P0 工作台 | `src/app/page.tsx`：标题 + 链到设置/Playbook，**无四区** |
| `/settings/` | P0 | `src/app/settings/page.tsx`：说明文案，**无表单** |
| `/playbook/` `/ui/` `/motion/` `/modules/` | P0 | 四页存在，读 `registry.ts` 列卡片 |
| `/library/` `/review/` `/quiz/` | P1 | **未建页**；禁止先写死导航 |

禁止：开放 `[id]`、`middleware.ts`、`pages/`、`src/app/api/`、动态 `route.ts`、Server Action。会话是客户端状态，不进 URL。`next.config.ts`：`output:'export'` + `images.unoptimized` + `trailingSlash:true`。链接一律尾斜杠。

Playbook = 动效/预设/**CRP 样例**唯一目录；登记处 `src/features/playbook/registry.ts`。`_dev/` 规划有、**目录不存在**。`src/app/layout.tsx` 已注入主题启动脚本。

### `src/features/`（规划 vs 磁盘）

| 域 | 职责 | 磁盘 |
|---|---|---|
| `transcript` | 录音、ASR 流、文稿 | **空** |
| `notes` | 大纲、导图 | **空** |
| `agent` | 静默状态机 + 可对话 | **空** |
| `settings` | 密钥/协议族/热词/主题 UI | **空**（仅路由页） |
| `library` / `review` / `quiz` | P1 | **空** |
| `playbook` | 预设登记 | `registry.ts` 仅清单，status 全 `planned` |
| `render-modules` | CRP | 仅 `types.ts`；无 `registry.ts`、无五模块目录 |

组装根 = `src/app/page.tsx`，**不要**新建 `features/workbench` 当横向 import 特区（`docs/designs/feature-communication.md`）。

### `src/lib/`

| 入口 | 角色 | 现状 |
|---|---|---|
| `ai/` | Vercel AI SDK 唯一入口（ADR-0006） | 再导出 + `createModel()`；**未接** `resolveSecret` |
| `db/` | PGlite+Drizzle 唯一入口（ADR-0007） | `getDb()` → `idb://classolo`；**无 schema / Repository / `constants.ts`** |
| `session/` | 跨域三通道（ADR-0017） | `export {}` |
| `providers/asr/` | ASR 唯一入口（ADR-0004） | 类型完整；`createASRProvider` **一律 throw** |
| `providers/secrets/` | 密钥唯一入口（ADR-0013） | `resolveSecret` **已实现** 优先级 |
| `theme/` | 跟随系统（ADR-0014） | `themeBootScript` **已接到** root layout |
| `platform/` | Electron IPC 门面 | **不存在**（设计要求 feature 永不碰 `window`） |
| `providers` Auth/Storage/Mail | 生态可插拔 | **不存在**（架构文有表，代码无接口文件） |

### `src/components/`

| 路径 | 角色 | 现状 |
|---|---|---|
| `layout/` | `react-resizable-panels` 封装（ADR-0008） | 直接再导出 Group/Panel/Separator/`useDefaultLayout`；**无 shadcn Resizable、无四区壳** |
| `mindmap/` | xyflow 封装（ADR-0005） | 再导出 ReactFlow 等；**未 re-export dagre** |
| `ui/` | shadcn | **空目录** |
| `markdown/` | streamdown 管线 | **不存在**（依赖已在 `package.json`） |

`electron/`：**不存在**。`package.json` **无** electron / electron-builder。依赖已钉：`ai`、`pglite`、`drizzle-orm@1.0.0-rc.4`、`@xyflow/react`、`zustand`、`zod` 等（`docs/libraries.md`）。

---

## 已拍板决策索引（ADR / spec 一句话）

全部 Accepted。推翻须新 ADR + Superseded，禁止 PRD 静默改口。

| ID | 一句话 | 路径 |
|---|---|---|
| 0001 | 本地优先；P0=四区工作台+ASR+导图+CRP+Agent；生态最晚 | `docs/adr/0001-project-scope.md` |
| 0002 | 无 EdgeOne/Vercel 云配；Web 版留生态期宝塔反代 4070 | `docs/adr/0002-no-cloud-deploy.md` |
| 0003 | shadcn + StudySolo 令牌；禁硬编码品牌色 | `docs/adr/0003-ui-design-system.md` |
| 0004 | 自研 `ASRProvider`；P0 三族：realtime-ws（上课默认）/ transcriptions-rest / local-engine | `docs/adr/0004-asr-universal-access.md` |
| 0005 | `@xyflow/react` + dagre；稳定 id diff；禁 markmap/elkjs/d3-flextree | `docs/adr/0005-mindmap-rendering.md` |
| 0006 | **唯一** Agent 框架 = Vercel AI SDK；`src/lib/ai/`；禁字符串模型 ID（会走 Gateway）；静默 Agent 自研薄状态机；pi 不进依赖 | `docs/adr/0006-agent-framework.md` |
| 0007 | PGlite + Drizzle `pg-core`；浏览器用 IndexedDB；Electron 期 main `userData` | `docs/adr/0007-local-database.md` |
| 0008 | 分屏经 shadcn Resizable；比例 **localStorage**，不进库 | `docs/adr/0008-split-layout.md` |
| 0009 | 静态导出 + `app://` 特权协议 + electron-builder NSIS；系统能力在 main；**Demo 不要求 exe** | `docs/adr/0009-electron-integration.md` |
| 0010 | 自研 CRP；tool 即渲染；P0 五模块；Gen UI=受控 DSL，禁任意 JSX | `docs/adr/0010-render-protocol.md` |
| 0011 | zustand / streamdown / lucide / sonner / framer-motion / @fontsource 沿用生态 | `docs/adr/0011-ecosystem-inherited-stack.md` |
| 0012 | 封闭静态路由 + Playbook 唯一预设目录 | `docs/adr/0012-static-routing-playbook.md` |
| 0013 | 密钥 **用户设置 > env > 空**；不进 PGlite | `docs/adr/0013-secrets-resolution.md`；`docs/specs/secrets-resolution.md` |
| 0014 | 默认 `prefers-color-scheme`；`localStorage['classolo-theme']` = system\|light\|dark | `docs/adr/0014-theme-follows-system.md` |
| 0015 | `main` 稳定、`dev` 集成；功能 PR **打向 dev**；CI=lint+tsc | `docs/adr/0015-git-github-workflow.md`；`docs/conventions/git-github.md` |
| 0016 | P0 **七张 `cs_` 表**；表结构软约束 | `docs/adr/0016-local-schema.md`；`docs/specs/local-schema.md` |
| 0017 | 三通道在 `src/lib/session`；禁通用 event bus；禁 feature 互 import | `docs/adr/0017-feature-communication.md`；`docs/designs/feature-communication.md` |

### 数据（P0 七表 + 不入库）— `docs/specs/local-schema.md`

软约束：改表先改 spec。前缀 `cs_`、单数、应用层 uuid、每表 `user_id`（P0 匿名常量 `00000000-0000-0000-0000-000000000001`）。P0 **不建** `cs_user`。

| 表 | 用途 |
|---|---|
| `cs_session` | 课堂会话头 |
| `cs_transcript_segment` | 转写段（时间轴真源；只存 final） |
| `cs_note_outline` | 大纲树 JSONB，1:1 session；**不存** xyflow 坐标 |
| `cs_render_message` | CRP 快照；上课中内存，收尾批量 |
| `cs_chat_message` | Agent 对话终态（流式 delta 不入库） |
| `cs_provider_profile` | AI/ASR 端点档案，**不含密钥**（`credential_ref` + `has_credential`） |
| `cs_setting` | 全局 KV；布局/密钥不进此表 |

**不入库**：API key、`.env` 值、音频 blob（P0 不保存）、ASR partial、流式 token、分屏比例、xyflow 像素坐标、滚动/选中、上课中 CRP、静默 Agent 状态机、完整 prompt。音频 P1 才进文件系统。

转写：ring buffer → 批量 INSERT（约 ≥20 段或 ≥10s）；幂等 `(session_id, seq)`。Agent P0 检索用 `ILIKE`，不做向量。

### 通信三通道 — `docs/designs/feature-communication.md`

1. **公开只读切片**（zustand vanilla）：仅拥有者 `setState`；外域订 `committedVersion` 等，**禁止** React 订 ASR partial。
2. **CRP 投影**：`upsert`/`revoke`，按 `id` 可更新撤回。
3. **命令总线**（自研 typed，不引入 mitt）：P0 仅 `transcript.scrollTo` / `highlight`、`asr.configChanged`、`ai.configChanged`、`session.reset`。

禁止：redux/jotai/valtio/mobx；mitt/eventemitter3；feature 横向 import；对非本域切片写入；feature 碰 `window.electron*`；布局进 session；密钥进公开切片；Server Action 当总线。`index.ts` 不导出 `writes/*`。ESLint `no-restricted-imports` **尚未写入** `eslint.config.mjs`。

### ASR — `docs/adr/0004-asr-universal-access.md` + `src/lib/providers/asr/types.ts`

接口：`start/sendAudio/stop` + `onPartial/onFinal/onError` + capabilities。用户必填族 + dialect + baseURL + key + 模型 + 采样率，禁止从 URL 猜。

| 族 | 阶段 | Demo |
|---|---|---|
| `realtime-ws`（dialect `stepfun` / `qwen`） | P0，上课默认真流式 | **关键路径** |
| `transcriptions-rest` | P0，UI 标「准实时」 | 非 Demo 闸门 |
| `local-engine`（sherpa-onnx） | P0，Electron 阶段 | 非 Demo 闸门 |
| `cloud-private-ws`（腾讯医学等） | P1 | — |
| `google-bidi` | 明确不做 | — |

热词：预置学科包 + 设置页自定义。Web Speech API 在 Electron 不可用，勿写进方案。

### Agent — ADR-0006

三角色均走 `src/lib/ai/`：笔记整理器（`Output.object` 流式结构化）、静默 Agent（自研节流状态机 + tool→CRP）、可对话（`streamText` + reasoning + 文稿检索）。模型经 `createOpenAICompatible` 实例，禁止字符串模型 ID。

### 导图 — ADR-0005

录音中笔记区恒为导图。增量：稳定 id 树 diff，旧节点保留坐标，新节点 dagre + 进入动画。点节点 → 命令 `transcript.scrollTo`（不是 notes 读 transcript 私有 store）。P0 树状布局 + 自定义节点外观。

### 布局 — ADR-0008 + 架构四区图

左导航（可收起）+ 文稿 + 笔记 + 各自下方渲染区。嵌套水平/垂直。比例 `useDefaultLayout` → localStorage。

### CRP — ADR-0010 + `docs/designs/render-module-protocol.md` + `src/features/render-modules/types.ts`

`RenderMessage{id, module, version, target, props, meta}`。`target`: `transcript` \| `notes`。`meta.source`: silent-agent \| chat-agent \| system。模块目录 `<name>/{manifest,Component,index}`，只依赖 `types.ts` / `src/lib` / `src/components/ui`。校验失败 → 错误卡片。锚点点击由 **Host** 发命令，模块不 import 命令总线。

P0 五模块：`image`（双区）、`rich-text`（双区）、`ai-ask`（transcript）、`gen-ui`（双区，受控 DSL）、`agent-status`（notes）。

### 密钥 — `docs/specs/secrets-resolution.md`

`userOverride?.trim() || env || null`。调用方只收 `resolveSecret()`，禁止业务自己读 `process.env`。开发期可用 `NEXT_PUBLIC_*` 仅作 env 降级，**不能**当发行版密钥源。Electron 用户覆盖进 `safeStorage`。`.env.example` 已列 `AI_*` / `ASR_*`（默认 `ASR_FAMILY=realtime-ws` `ASR_DIALECT=stepfun`）/ `IMAGE_SEARCH_API_KEY`。

### 主题 — ADR-0014

已实现启动脚本：`src/lib/theme/boot-script.ts` → `src/app/layout.tsx`。设置页强制 light/dark **UI 未做**。色只挂 `.light`/`.dark`（`src/styles/tokens.css`）。

### Git — `docs/conventions/git-github.md`

仓库 `https://github.com/AIMFllyYS/Classolo`。`main` 可发布、禁日常直推；`dev` 集成；`feat|fix|chore/<slug>` 从 **dev** 拉、PR **打回 dev**。发版 `dev→main`。Loop/功能 PR 默认目标 **dev**。Commit：Conventional Commits。Issue/PR 前查 `docs/skills-registry.md`。CI：`.github/workflows/ci.yml` lint + `tsc --noEmit`。

---

## 代码现状（骨架 vs 空）

判定：读过下列文件，非推测。

| 文件 | 有什么 | 没有什么 |
|---|---|---|
| `src/app/page.tsx` | 营销句 + Link | 四区、录音、导图、渲染 Host、Agent |
| `src/app/settings/page.tsx` | 文案提到 ADR-0013 | 密钥表单、协议族、热词、主题切换 |
| `src/app/playbook/**` | 导航 + 列表渲染 registry | 真实 UI/动效/模块演示（无组件实例） |
| `src/features/playbook/registry.ts` | id 清单，全 `planned` | ready 预设 |
| `src/features/render-modules/types.ts` | `RenderMessage` 接口 | registry、五模块、Host、zod manifest |
| `src/lib/ai/index.ts` | `createModel` + 再导出 `streamText`/`tool` | 笔记整理、静默循环、useChat 封装；config 自带 apiKey，未调 secrets |
| `src/lib/db/index.ts` | 单例 PGlite IndexedDB | 七表、drizzle-kit、flush、压测 |
| `src/lib/session/index.ts` | 注释 + `export {}` | reads/writes/commands/projection |
| `src/lib/providers/asr/types.ts` | 六族类型 + Provider 接口 | —（类型层已拍板） |
| `src/lib/providers/asr/index.ts` | `createASRProvider` switch | 任一 adapter 实现 |
| `src/lib/providers/secrets/*` | `resolveSecret` 三级 | 设置页注入 userOverride；Electron safeStorage |
| `src/lib/theme/boot-script.ts` + layout | **已有行为**：首屏 class、防闪 | 设置页写入 storage |
| `src/components/layout/index.ts` | 库再导出 | 工作台壳、持久化 key 约定落地 |
| `src/components/mindmap/index.ts` | xyflow 再导出 | dagre 布局、自定义节点、diff |
| `src/styles/*` | 令牌 + min-width 768 | — |
| `eslint.config.mjs` | next 默认 | feature 互 import 限制 |
| `electron/`、`src/app/_dev/`、`src/lib/db/schema/` | — | **不存在** |

**已有真实行为（非占位）**：静态导出配置、4070 脚本、root layout + 主题 boot、tokens/base CSS、Playbook 路由能列出 planned 卡片、密钥 env 降级函数、PGlite 能 `getDb()`（无表）、AI `createModel` 能构造 provider 实例（无业务调用方）。

---

## P0 / P1 / P2 / 生态 需求速览

摘自 `docs/plans/roadmap-p0-p1-p2.md`（清单全未勾）。依赖只标硬前置。

### P0（课堂工作台）

| 块 | 需求要点 | 依赖 |
|---|---|---|
| 布局 | 四区 Resizable；导航可收起；比例 localStorage；非手机 | ADR-0008；Playbook `workbench-shell` |
| 文稿 | 开始/暂停/结束；16k PCM；增量流+重连；热词 | Demo：一家 realtime-ws + env；采集原生 MediaRecorder/AudioWorklet |
| ASR×3 | realtime-ws 默认；REST 伪流式；local-engine Electron | Demo 不阻塞后两家 |
| 笔记 | AI 增量大纲；xyflow+dagre 不闪；点击回跳 | session 命令；`committedVersion` 节流；ADR-0005/0006 |
| 渲染 | CRP + 注册表；五模块 | Agent tool；`types.ts` |
| Agent | `lib/ai`；静默节流；对话+reasoning+检索 | 转写 committed；禁按句触发 |
| 数据 | 七表 + 45–90min 压测 | 软约束 spec；Demo 可不挡在「能上课」之后 |
| 设置 v1 | AI/ASR 协议族 + key | 密钥优先级；可先 env 跑 Demo |
| Electron | export + app:// + NSIS + updater | **非 Demo 停点** |

里程碑顺序（路线图）：布局 → 文稿 → 笔记 → CRP → Agent → Electron → P1…。Demo 可在「一家真流式 + 导图 + 至少 1–2 个渲染模块 + 设置/env」处截断，须在 PRD 写明。

### P1（依赖 P0 会话可保存）

录音进导航历史；导航完整形态（新录音/新对话/资源库/复习站/测试站+底部设置）；新对话（检索历史课、教材、skills——借鉴 pi **实践不引包**）；知识清单+卡片；复习站（SRS 候选 ts-fsrs，未选型）；后台出题（`powerSaveBlocker`+通知）；`question-schema.md`；腾讯医学 ASR；通用 Agent 仍只走 `lib/ai`。预留表名见 spec 第六节，**不提前建表**。

### P2

错题→知识点加固；掌握度（recharts）；考期押题；素材库增强。

### 生态（最晚，独立阶段）

Storage→Supabase（`cs_` 已 P0 带上）；Auth→`account.1037solo.com` `client_id=classolo`；Mail 共享推送；宝塔 `classolo.1037solo.com.conf` 反代 4070；会员对齐。迁移面收敛：换驱动 + `user_id` 回填 + RLS（spec 第七节）。

---

## PRD 作者禁止事项

1. **不要推翻 ADR**（换 Agent 框架、换 SQLite、开放 `[id]`、密钥进 `cs_*`、feature 互 import、通用 event bus、云部署专属配置、elkjs/pi/Mastra 等 `docs/libraries.md` 禁令）。要改口 → 新 ADR，不是写进 PRD 当既成。
2. **不要把 Electron exe 当 Demo 验收**。P0 有打包设计；Demo = 浏览器 4070。
3. **不要要求 Demo 三家 ASR 齐活**。上课默认一家 realtime-ws + env；另两家写 P0 范围即可。
4. **不要写死密钥只认 env 或只认设置**。顺序固定：用户覆盖 > env > 空。
5. **不要设计 features 互调 store**。跨域只经 `src/lib/session`；回跳用命令不是读私有滚动位置。
6. **不要在 PRD 里发明第 8 张 P0 表或把音频/partial/布局坐标入库**。先改 `local-schema.md`。
7. **不要用动态路由表达「某一课」**。会话客户端状态；P1 分享 URL 须新 ADR。
8. **不要把动效/按钮皮肤散落在工作台**。只登记 Playbook。
9. **不要把 Loop PR 打向 main**。打 `dev`。
10. **不要把静默 Agent 做成按句触发**；不要让 Gen UI 执行任意模型代码；不要用字符串模型 ID。
11. **不要把生态 SSO/Supabase 写进 P0/Demo**。本地匿名用户即可。
12. **不要新增生产依赖当既定方案**（AI 无权单独立项；先 libraries.md）。状态库已是 zustand。

---

## 实现期对照（给 PRD 拆任务用，非需求）

设计已写、代码未建（摘自通信文落地清单 + 目录树）：`src/lib/session/{types,commands,render-projection,reads,writes}`；`eslint` 限制；`src/lib/db/schema` + Repository；`src/lib/providers/asr/realtime-ws/` 等；`src/features/{transcript,notes,agent,settings,render-modules/<五名>}`；`src/components/ui` + 四区壳；`electron/main|preload`。压测口径在 spec §4.6，属 P0 工程，非 Demo 闸门。
