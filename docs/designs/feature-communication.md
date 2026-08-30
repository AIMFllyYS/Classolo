# Feature 间通信（三通道）

> Created: 2026-08-30
> Updated: 2026-08-30
> Status: accepted
> 决策记录：[ADR-0017](../adr/0017-feature-communication.md)
> 配套：CRP [render-module-protocol.md](./render-module-protocol.md)、总架构 [architecture-overview.md](./architecture-overview.md)

## 问题陈述

课堂工作台同时存在多条异构数据流，而 `src/features/` **禁止横向 import**（`AGENTS.md` / `architecture-overview.md` 红线）：

| 流 | 典型频率 | 消费者 |
|---|---|---|
| ASR 转写 partial | 适配器驱动的高频 | 仅文稿区 UI |
| 已确认转写段（`onFinal` / 语义段） | 低于 partial；笔记「数秒一次」 | 笔记整理器、静默 Agent、对话 Agent 检索 |
| 笔记大纲 / 思维导图 | 数秒一次 | 笔记区 UI；Agent 只读提纲以免重复 |
| CRP `RenderMessage` | 按工具调用 | 双渲染区 |
| 静默 Agent / 对话 Agent 内部态 | 内存态 | 各自 UI；思考呈现走 CRP `agent-status` |
| 设置变更（ASR/AI 协议族、热词） | 用户操作级 | Provider 重建；录音中的 ASR 需知情 |
| Electron main IPC（打包阶段） | 系统能力 | `lib/db`、`lib/providers`、通知/电源 |
| 生态期云同步（最晚） | 会话级 | `StorageProvider`，不是 UI 总线 |

还要满足：无 Server Actions / 无动态 Route Handler；P0 单页工作台 + `settings` 等静态路由；会话状态主要在客户端；状态库所有者是 zustand（禁止为「通信」再引入 redux / jotai / valtio / mobx）；布局比例已由 ADR-0008 走 `useDefaultLayout` + localStorage，**禁止塞进本层**。

「禁止横向 import」若没有可执行边界，会退化成：偷偷互相 import store、或引入通用 event bus 变成隐形依赖图。本文给出 **谁可以读谁、消息长什么样、文件放哪、lint 怎么拦**。

## 方案对比

| 方案 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| **A. 纯 props 提升** | 路由把所有状态lift 到 `src/app/` | 无全局、依赖清晰 | 工作台会变成上帝组件；静默 Agent / ASR 回调不是 React 树能干净表达的 |
| **B. 通用 event bus 包** | 引入 mitt / eventemitter3 / nanoevents，feature 乱发字符串事件 | 解耦表面简单 | 无当前值、时序难测、事件名膨胀；mitt@3.0.1 自 2023-07-04 后再无功能发版；与「少依赖」纪律冲突 |
| **C. 共享一个 zustand 上帝 store** | 全领域字段进同一 store | 订阅现成 | 消灭领域边界，等于允许横向耦合 |
| **D. 允许 `features/*/public.ts` 互引** | 横向 import 开例外 | 类型就近 | 红线被撕开后难以审计；循环依赖风险 |
| **E. 三通道（本决策）** | 私有 store 留在 feature；跨领域只经 `src/lib/session/`：**公开只读切片** + **CRP 投影** + **命令总线** | 对齐现有 zustand / CRP；P0 零新依赖；Electron/云可接同一边界 | 要维持 writer 白名单与 lint |

## 最终决策

采用 **E：三通道**，全部落在 `src/lib/session/`（不属于任何 feature，供 `app → features → lib` 的向下依赖使用）。

1. **领域私有 store**（zustand，写在 `src/features/<domain>/`）：高频 UI、录音机内部、xyflow 节点坐标、对话消息草稿。外域 **禁止** import。
2. **公开只读切片**（`zustand/vanilla` + `subscribeWithSelector`）：外域可读当前值 / 做非 React 订阅；**只有拥有者 feature 可 `setState`**。
3. **CRP 投影**（zustand，按 `id` upsert/revoke）：`RenderMessage` 的唯一投递面。这是**状态**（要更新/撤回），不是一次性事件。
4. **命令总线**（自研 ~40 行 typed pub/sub，**不引入** mitt / eventemitter3）：一次性意图（回跳文稿、配置已变更、会话重置）。不保存当前值。
5. **组装根 = 路由层**：`src/app/page.tsx`（及 settings 等静态页）可以 import 多个 feature 的 UI。不为此新开 `features/workbench/` 以免制造「唯一可以横向 import 的 feature」特例。

P0 用 **模块单例 store**（同时只上一节课）。P1 打开历史会话时，把同一套 slice **改成 vanilla `createStore` + React context**（zustand 官方配方），不改切片字段、不改命令联合类型。

## 决策理由

- 红线是「feature 不 import feature」，不是「进程里不能有共享状态」。共享契约放 `lib` 与 Provider 层同一纪律。
- 转写 partial 与大纲更新的频率差一个数量级：必须在 **投影边界** 截住，而不是靠组件「自己 debounce」。
- CRP 已规定 `id` 可更新/撤回 → 渲染通道必须是可寻址 store，不能是 fire-and-forget bus。
- 点节点回跳是 **意图**，文稿区当前滚动位置不是 notes 该读的状态 → 走命令，不走切片。
- 2026-08-30 核对：zustand@5.0.15 仍把 `subscribeWithSelector` / 组件外 `subscribe` / vanilla store 当作一等 API；课堂高频流应走 **transient subscribe**，避免 notes/agent 随 partial 重渲染。
- 通用 bus 包：eventemitter3@5.0.4（2026-01-19）仍在维护，但本层事件集合是 **封闭联合类型**，自研更短且能 exhaustive check；mitt 已停滞。默认不引入。

## 三通道定义（可执行）

```
                    ┌─────────────────────────────────────────┐
                    │     src/lib/session  （唯一跨域边界）    │
                    │  reads/*   render-projection   commands │
                    └──────┬────────────┬─────────────┬───────┘
         只读订阅/getState │            │ upsert      │ publish
                           │            │             │
   transcript/notes/agent  │     agent/system         │ notes/host/settings
   （各写自己的 reads）     │     （写投影）            │ （发命令）
                           ▼            ▼             ▼
                      私有 zustand    渲染 Host      文稿滚动等
                      仅本 feature    分发到模块      仅命令消费者
```

判定口诀（写代码前问一次）：

| 问 | 是 → 走 | 否 → |
|---|---|---|
| 对方需要「现在的值」，且会持续变？ | 公开只读切片 | — |
| 需要更新/撤回已展示块（有稳定 `id`）？ | CRP 投影 | — |
| 一次性副作用（滚动、重置、重启 ASR）？ | 命令总线 | — |
| 只有本区 UI 用？ | 领域私有 store | 不要提升 |
| 布局比例？ | **禁止**本层；ADR-0008 localStorage | — |
| 密钥 / Provider 配置？ | settings 私有 + `src/lib/providers` 工厂 | 切片最多暴露 `*Ready` / `*Version` |

## 数据分类

### 1. 领域私有（禁止跨域）

| 拥有者 | 内容 | 理由 |
|---|---|---|
| `transcript` | MediaRecorder / AudioWorklet 句柄、partial 文本、ring buffer、重连态、电平 | 高频；外域订阅会拖垮 React |
| `notes` | xyflow 节点/边、视口、拖拽中坐标 | 渲染库内部态；回跳不需要它 |
| `agent` | 静默状态机指针、`useChat` 消息、tool 调用 inflight | 内存态（ADR-0006）；对外只通过 tool → CRP |
| `settings` | API key、baseURL 原文 | 禁止进公开切片 |
| `render-modules/<name>` | 模块内部 UI 态 | 协议已禁止模块互读 |

### 2. 必须跨域只读订阅（公开切片）

字段是 **投影**，不是把私有 store 原样 export。

**`TranscriptPublic`（仅 `transcript` 写入）**

| 字段 | 何时更新 | 谁读 |
|---|---|---|
| `sessionId` | 开始录音 / 重置 | 全课堂消费者 |
| `recordingStatus` | `'idle' \| 'recording' \| 'paused' \| 'stopped'` | notes 标题、agent 是否触发、设置页提示 |
| `committed` | **仅** ASR `onFinal`（或语义段聚合后）append | Agent 检索工具 `getState()`；**禁止** notes 组件直接订阅整个数组 |
| `committedVersion` | 每次 committed 变更 +1 | notes 整理器、静默 Agent：`subscribe` 此数字再 debounce |
| `latestCommittedId` | 同上 | 命令回跳的默认锚点 |

**`NotesPublic`（仅 `notes` 写入）**

| 字段 | 何时更新 | 谁读 |
|---|---|---|
| `outlineVersion` | 大纲流式一段落定稿 | 静默 Agent（避免重复讲解） |
| `outlineDigest` | 节点 id + 标题的浅列表，**不含**位置 | Agent 只读；不是 xyflow 对象 |

**`SettingsPublic`（仅 `settings` 写入）**

| 字段 | 何时更新 | 谁读 |
|---|---|---|
| `asrConfigVersion` / `aiConfigVersion` / `hotwordsVersion` | 用户点保存 | 只当版本号；真正配置经 Provider 工厂 |
| `asrReady` / `aiReady` | 校验成功 | 工作台禁用态 |

**`AgentPublic`（仅 `agent` 写入）**

| 字段 | 何时更新 | 谁读 |
|---|---|---|
| `silentPhase` | 状态机跃迁 | 需要时；默认思考 UI 走 CRP `agent-status`，不必再开切片 |
| `chatOpen` | 用户打开对话 | 布局层以外的 UI；**不要**放进 resizable 比例 |

P0 可把 `AgentPublic` 缩到最小：若 CRP `agent-status` 已够，就不建第三份 agent 切片。

### 3. 必须单向消息

| 通道 | 载荷 | 生产者 | 消费者 |
|---|---|---|---|
| CRP 投影 | `RenderMessage`（见 `src/features/render-modules/types.ts`） | 静默/对话 Agent（tool 执行）、`source: 'system'` | `render-modules` Host 按 `target` + `module` 分发 |
| 命令总线 | `SessionCommand` 封闭联合 | 见下节清单 | 指定拥有者 |

## P0 允许的通信矩阵

图例：`W` 写入 / `R` 只读 / `P` publish / `S` subscribe / `—` 禁止。`priv` = 该 feature 私有 store。

| 消费者 ↓ \ 资源 → | transcript priv | TranscriptPublic | notes priv | NotesPublic | SettingsPublic | CRP 投影 | 命令总线 | `window.electron*` | 布局 localStorage |
|---|---|---|---|---|---|---|---|---|---|
| `transcript` | W | W | — | — | R（版本号） | — | S：`transcript.*`；P：`session.reset`（结束录音时可选） | — | — |
| `notes` | — | R：`committedVersion`（非 React 订阅 + debounce）；**禁止**订阅 partial | W | W | — | — | P：`transcript.scrollTo` | — | — |
| `agent` | — | R：`getState().committed` 做检索工具；R：`committedVersion` 节流触发静默循环 | — | R：`outlineDigest` | 经 `lib/ai` `createModel()`，不读 key | W | P：回跳（引用卡片）；S：`session.reset` | — | — |
| `render-modules` Host | — | — | — | — | — | R | P：`transcript.scrollTo`（锚点点击） | — | — |
| `render-modules/<name>` | — | — | — | — | — | 只渲染自己的 props | —（不直接发命令） | — | — |
| `settings` | — | — | — | — | W | — | P：`asr.configChanged` / `ai.configChanged` | — | — |
| `src/app/*` 路由组装 | — | 可选 R 状态灯 | — | — | 可选 R | 挂载 Host | — | — | R/W 仅 layout 封装 |
| `src/lib/db` / `providers` | — | — | — | — | — | — | — | 仅经 `src/lib/platform/` | — |
| `library` / `review` / `quiz` | P0 不接线 | P1 按同样规则加切片 | — | — | — | — | P1 扩展联合类型 | — | — |

硬规则补充：

- **任何 feature 不得 import 另一 feature 的任何路径**（含 `store.ts`、`public.ts`、组件）。
- **任何 feature 不得对非本域切片调用 `setState`**。
- 笔记整理器与静默 Agent **不得**用 React `useStore(transcript)` 去订 `committed` 全数组；必须 `subscribe(selector)` 在 feature 模块或 `useEffect` 里做，并 debounce / 语义段节流（ADR-0006：禁止按句触发静默 Agent）。
- 对话 Agent 的「检索文稿」工具：调用时 `getState()` 快照，不订阅。

## 消息类型清单（P0 封闭）

### A. CRP（已有，不在此重复发明）

见 `src/features/render-modules/types.ts`。本层只规定 **投递 API**：

```ts
upsertRenderMessage(msg: RenderMessage): void  // 同 id = 更新
revokeRenderMessage(id: string): void
```

Host 按 `msg.target` 取列表。模块校验失败仍由 Host 渲染错误卡片（ADR-0010）。

### B. `SessionCommand`（本层新增，P0 仅这些 variant）

```ts
type CommandSource = 'notes' | 'render' | 'agent' | 'settings' | 'system'

type SessionCommand =
  | {
      type: 'transcript.scrollTo'
      segmentId: string
      source: CommandSource
    }
  | {
      type: 'transcript.highlight'
      segmentId: string
      source: CommandSource
    }
  | {
      type: 'asr.configChanged'
      source: 'settings'
    }
  | {
      type: 'ai.configChanged'
      source: 'settings'
    }
  | {
      type: 'session.reset'
      reason: 'new-recording' | 'user'
    }
```

| `type` | 谁 P | 谁 S | 语义 |
|---|---|---|---|
| `transcript.scrollTo` | notes（节点点击）、render Host（`transcriptAnchor`）、agent（引用） | **仅** transcript | 滚动并可选高亮该段 |
| `transcript.highlight` | 同上（若只需高亮不滚动） | 仅 transcript | |
| `asr.configChanged` | settings | transcript | 未录音：下次 `start` 用新 Provider；录音中：P0 建议 toast「下次录音生效」，不中途热切（热切留 P1） |
| `ai.configChanged` | settings | agent / notes 整理器 | 下一轮推理用新 `createModel()` |
| `session.reset` | transcript 或系统 | 所有公开切片 writer + CRP `revoke` 全部 | 清空投影；私有 store 由各 feature 自行 reset |

**新增命令 = 改本联合类型 + 改矩阵 + 改 ADR-0017「何时重审」清单**。禁止 feature 里发明未登记字符串事件名。

P0 **不要**加：`notes.focusNode`、同步类命令、布局命令、任意 `*` 通配。

## 目录与 import 规则

落地时建立（P0 实现阶段，不在本文提交代码）：

```
src/lib/session/
  types.ts                 # TranscriptPublic、NotesPublic、SessionCommand
  commands.ts              # 自研 typed bus：publishCommand / subscribeCommands
  render-projection.ts     # zustand vanilla：按 target 存 RenderMessage[]
  reads/
    transcript.ts          # createStore + useTranscriptPublic(selector)
    notes.ts
    settings.ts
  writes/                  # 仅拥有者可 import
    transcript.ts          # patchTranscriptPublic(...)
    notes.ts
    settings.ts
    render.ts              # upsert/revoke；agent + system 可 import
  index.ts                 # 只 re-export types、reads hooks、commands、render 的只读 hook
src/lib/platform/          # Electron 到来时：desktop.ts + noop.ts；feature 永不碰 window
```

### ESLint（不新增插件，用核心 `no-restricted-imports`）

P0 实现时写入 `eslint.config.mjs`（现有扁平配置，无 boundaries 插件）：

1. `files: src/features/**` 禁止 `import` 路径匹配 `@/features/**` 或 `../<other-feature>`（域内相对路径允许）。实践：feature 之间只用相对路径引用**自己**的文件；跨域一律 `@/lib/session` 或 `@/lib/providers`。
2. `writes/transcript` 仅允许 `src/features/transcript/**`。
3. `writes/notes` 仅允许 `src/features/notes/**`。
4. `writes/settings` 仅允许 `src/features/settings/**`。
5. `writes/render` 仅允许 `src/features/agent/**` 与 `src/features/render-modules/host.*`（或 registry 同级 Host，**不含** `<name>/Component.tsx`）。
6. 全仓库 `src/features/**`、`src/app/**` 禁止 `window.electron`、`window.electronAPI`、`window.classolo`、`ipcRenderer`。
7. 禁止从 `src/lib/session` import 布局相关 key（本层根本不定义它们）。

组装根例外：`src/app/**` **可以** import `@/features/<name>/...` 的 UI。

### 渲染模块（沿用 ADR-0010）

- `<name>/` 只依赖 `types.ts`、`src/lib`（**不含** `session/writes`）、`src/components/ui`。
- 锚点点击：**不要**让模块 import 命令总线。Host 注入：

```ts
<ModuleComponent
  {...validatedProps}
  onTranscriptAnchorClick={
    meta.transcriptAnchor
      ? () => publishCommand({
          type: 'transcript.scrollTo',
          segmentId: meta.transcriptAnchor,
          source: 'render',
        })
      : undefined
  }
/>
```

`onTranscriptAnchorClick` 是 Host 包装 props，不进入 CRP schema（避免协议膨胀）。

## 频率与 zustand 订阅（2026-08-30 核实）

仓库依赖：`zustand ^5.0.11`。[npm](https://www.npmjs.com/package/zustand) 当时最新 **5.0.15**（发布 2026-08-13）。以下 API 来自 [zustand README（main / 5.0.15）](https://github.com/pmndrs/zustand/blob/main/README.md) 与 [v5 迁移文档](https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5)。

| 用途 | API | 入口（以已装包 `exports` 为准） |
|---|---|---|
| React 多字段选取 | `useShallow` | README：`zustand/react/shallow`；v5 迁移文曾写 `zustand/shallow` |
| 组件外按切片订阅 | `subscribeWithSelector` | `zustand/middleware`；签名 `subscribe(selector, cb, { equalityFn, fireImmediately })` |
| 无 Provider 的可读封装 | `createStore` | `zustand/vanilla`；再用 `useStore(store, selector)` |
| 高频但不驱动 React | README「Transient updates」 | `useEffect(() => store.subscribe(...), [])` + ref |

公开切片 **必须** `createStore(subscribeWithSelector(...))`，这样 notes/agent 才能订 `committedVersion` 而不订全 store。

v5 行为：selector 每次返回新引用会无限重渲染。跨域 React 读取必须：

- 选 **原子字段**（`s => s.committedVersion`），或
- `useShallow` 包一层对象选取。

**禁止**用 `persist` middleware 持久化课堂切片（持久化所有者是 PGlite / ADR-0007）。**禁止**用 zustand `persist` 去存布局（所有者是 resizable `useDefaultLayout`）。

### 转写投影怎么写（伪代码口径）

```ts
// features/transcript：ASR onPartial → 只 set 私有 store
// ASR onFinal → writes/transcript.appendCommitted(segment)
// lib/session/writes/transcript.ts 内：committed append + committedVersion++

// features/notes 整理器（非组件函数）：
unsubscribe = transcriptStore.subscribe(
  (s) => s.committedVersion,
  () => scheduleOutlineJob(), // 内部 3–8s debounce 或等语义段；禁止逐次 onFinal 打满模型
)
```

具体 debounce 毫秒数 **未压测，不写死**；实现时用常数放 `notes` 私有配置，可在设置页后期暴露。

## Electron 到来后：接到同一套边界

约束来源：ADR-0009（系统能力在 main，IPC 供 renderer）；[Electron IPC 教程](https://www.electronjs.org/docs/latest/tutorial/ipc)（页面内 fiddle 标注 **44.0.0**，与本仓库 Electron 44 基线一致）；[Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)（默认开启；preload 用 `contextBridge.exposeInMainWorld`；**禁止**把整个 `ipcRenderer.send` / `invoke` / `on` 暴露给页面）。

官方三模式对本项目的用法：

| 模式 | API | 用在 |
|---|---|---|
| Renderer → main 单向 | `ipcRenderer.send` ↔ `ipcMain.on` | 通知、`powerSaveBlocker` 开/关 |
| Renderer → main 双向 | `ipcRenderer.invoke` ↔ `ipcMain.handle`（官方推荐，Electron 7+） | 落盘 SQL、选文件、本地 ASR 控制 |
| Main → renderer | `webContents.send` + preload 里 **包装后的** `ipcRenderer.on`（回调不要直接传入以免泄漏 `event.sender`） | 本地引擎 partial/final、电源/通知回推 |

### 分层（feature 永远看不到 IPC）

```
feature  →  lib/db 或 lib/providers 或 lib/session
              ↓
         lib/platform/desktop.ts   // 浏览器为 noop
              ↓
         window.classoloAPI.*      // 仅此文件读取
              ↓
         electron/preload.ts       // 一方法一频道，带参数过滤
              ↓
         electron/main             // ipcMain.handle('db:query', ...)
```

频道名用能力前缀（官方示例 `dialog:openFile` 同款命名空间，前缀无运行时意义）：

- `db:query` / `db:exec`（PGlite 迁 main `userData` 时）
- `notify:show`
- `power:block` / `power:unblock`
- `asr-local:start` | `send` | `stop`（sherpa-onnx）
- **不要**出现 `transcript:scrollTo` 这类业务频道——滚动发生在 renderer 内，main 不知情

Main 推送的 ASR 字节流：`lib/providers/asr` 的 `local-engine` 适配器订阅 platform 事件，再回调 `onPartial/onFinal`；**transcript 只对 ASRProvider**，与今天浏览器 realtime-ws 同一接口。公开切片仍由 transcript 在 `onFinal` 时写入。会话三通道 **不跨进程**。

### CVE-2026-70601（2026-08 公开）

[CVE Record](https://www.cve.org/CVERecord?id=CVE-2026-70601) / 顾问 GHSA-h7rp-cf8h-j98x：`contextBridge` 暴露 **返回 Promise 的函数**（典型即 `ipcRenderer.invoke` 包装）时，若窗口加载 **不可信** 页面，可通过 `Function.prototype.bind` 劫持逃到 preload。修补线：39.8.9、40.9.2、41.2.2、42.0.0-beta.5。

Classolo 工作台只加载可信 `app://`（ADR-0009），顾问口径下「从不加载不可信内容则不受影响」。仍要求：

- 打包钉在 Electron **44 稳定线**（[v44.0.0](https://releases.electronjs.org/release/v44.0.0) 晚于 42.0.0-beta.5，**按版本顺序应含修复**；是否在 44.0.0 changelog 点名该 CVE **未逐条核对**）。
- `sandbox` 保持默认开启；`nodeIntegration: false`；`contextIsolation: true`。
- 不在工作台窗口加载第三方网页；Gen UI 继续受控 DSL（ADR-0010）。

## 生态期云同步：不推翻 P0 模型

三通道是 **本机一节课的 UI 运行时**，不是同步协议。

| 层 | P0 | 生态接入期 |
|---|---|---|
| UI 真相 | 公开切片 + CRP 投影 + 私有 store | **不变** |
| 持久化真相 | `StorageProvider` → PGlite | 换 Supabase 实现 + `cs_` 前缀（ADR-0007） |
| 写入路径 | 拥有者 feature：`writer.patch` **并且** `repository.insert` | 同左；同步引擎只活在 StorageProvider 内 |
| 命令 | 不落盘 | 仍不落盘 |
| 直播 CRP | 内存投影；课后是否入库由 P1 资源库决定 | 历史课从 DB hydrate 成 `source: 'system'` 消息，不 live-sync 每一帧 |

Hydrate 顺序（打开一节已保存课，P1）：

1. `repository.load(sessionId)`
2. 各 `writes/*` 填公开切片（不是 feature 去 import 对方 store）
3. `upsertRenderMessage` 重放已持久化的渲染块
4. 不重放命令

冲突策略 P0/P1：**按行 last-write-wins**。CRDT / 多设备同时上课 **未选型，未核实**，到生态接入期单独立 ADR，不在 session 总线里做合并。

因此：禁止把「云同步」做成第四条全局 bus；禁止 feature 订阅 `sync.*` 字符串事件。

## 跨领域 UX：点思维导图节点回跳文稿

这是矩阵里已有的路径，不是特例协议。

```
用户点击 notes 思维导图节点
  → 节点 data 持有 segmentId（生成大纲时 notes 私有态关联，来自 TranscriptPublic.committed[].id）
  → notes 调用 publishCommand({ type: 'transcript.scrollTo', segmentId, source: 'notes' })
  → transcript 在 mount 时 subscribeCommands
  → 仅文稿区滚动 / highlight（私有 UI）
```

渲染区图片/富文本上的 `meta.transcriptAnchor`：模块不读 transcript store；Host 发 **同一条** `transcript.scrollTo`（`source: 'render'`）。

对话 Agent 引用某句：agent 发同一条（`source: 'agent'`）。

失败态：`segmentId` 找不到 → transcript 吞掉并 `console.warn`（P0 不弹总线错误 UI）。

## 明确禁止（实现期 review 用）

1. 为通信引入 redux / jotai / valtio / mobx，或 mitt / eventemitter3 / nanoevents / 其它通用 bus 包。
2. Feature 或 CRP 模块直接使用 `window.electron*` / `ipcRenderer` / 未过滤频道。
3. 外域 React 订阅转写 **partial**；或把分屏比例、token 原文放进 `src/lib/session`。
4. Feature 横向 import；或对非本域切片 `setState`。
5. 未改封闭联合类型就 `publishCommand` 新字符串。
6. 用 Server Action / `route.ts` 当 feature 通信（静态导出不支持，且与本层无关）。

## 落地检查清单（P0 写第一行通信代码时）

- [ ] `src/lib/session/` 按上表建好；`index.ts` 不导出 `writes/*`
- [ ] `eslint.config.mjs` 限制 import（见上）
- [ ] transcript：partial 私有、final 进 `TranscriptPublic`
- [ ] notes：只订 `committedVersion`；节点 `data.segmentId` 齐全
- [ ] agent tool 检索走 `getState()`；静默循环订 version + 节流
- [ ] CRP 只经 `writes/render`；模块无命令 bus import
- [ ] 设置保存发 `*.configChanged`，不把 key 写入公开切片
- [ ] 布局仍只走 `src/components/layout` + localStorage
- [ ] 同步改 `docs/conventions/project-structure.md` 目录树（实现 PR，不在本 ADR 提交）

## 核实来源（2026-08-30）

| 项 | 来源 | 结论 |
|---|---|---|
| zustand 版本 | `pnpm view zustand version` → **5.0.15**（npm time 2026-08-13）；本仓库 range `^5.0.11` | v5 仍是所有者 |
| `subscribeWithSelector` / transient subscribe / vanilla `createStore` | [zustand README](https://github.com/pmndrs/zustand/blob/main/README.md)（与 npm 5.0.15 同源） | 用作跨域非 React 订阅 |
| `useShallow` | README：`zustand/react/shallow`；[v5 迁移](https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5)：`zustand/shallow` | 实现时对已装包试编译，不写死错误路径 |
| eventemitter3 | `pnpm view` **5.0.4**（npm time 2026-01-19） | 维护中，P0 仍不引入 |
| mitt | npm **3.0.1**（功能发版 2023-07-04） | 停滞，不引入 |
| Electron IPC | [IPC tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc) fiddle **44.0.0**；[context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) | preload 一方法一频道；`invoke`+`handle` 做双向 |
| Electron 44 | [releases v44.0.0](https://releases.electronjs.org/release/v44.0.0)（抓取时页上为 Latest Stable）；内嵌 Node **v24.18.1**（与开发机 Next 要求 Node ≥22.12 **不是同一件事**） | IPC 模式按 44 文档 |
| CVE-2026-70601 | cve.org 2026-08-05；修补 39.8.9 / 40.9.2 / 41.2.2 / 42.0.0-beta.5 | 可信 `app://` + 钉 44 |

## 未核实

- 45–90 分钟课上 `committed[]` 常驻内存的上限（与 ADR-0007 写入压测绑定；切片是否改为「窗口 + 按 id 查询 DB」待压测后）。
- notes debounce 的最佳毫秒数。
- Electron 44.0.0 release notes 是否 **点名** CVE-2026-70601。
- 生态多设备同时写同一 `cs_` 行的合并策略。
- `eslint-plugin-boundaries` 是否值得在 P1 引入（P0 用核心规则即可，引入须走 libraries.md）。

## 风险

- 单例 store 在 P1「历史课 + 新录音」并存时不够用 → 按 zustand context 配方升级，切片字段保持兼容。
- `committed[]` 全量放切片导致 Agent `getState` 过大 → 检索工具改走 `lib/db` 查询，切片只留 version + 最近 N 段。
- 命令总线 listener 抛错会中断后续消费者 → 实现里逐 handler `try/catch`。
- 组装根若被误建成 `features/workbench` 并允许横向 import，红线会在半年内被拆穿 → 不要开这个例外。
