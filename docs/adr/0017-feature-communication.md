# ADR-0017: Feature 间通信 —— 三通道（只读切片 / CRP 投影 / 命令总线）

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 设计正文：`docs/designs/feature-communication.md`（矩阵、命令联合类型、目录、lint、Electron/云扩展）

## 背景

`src/features/` 禁止横向 import（`AGENTS.md`、architecture-overview）。工作台却同时有：ASR 高频 partial、已确认转写、数秒一次的笔记大纲、CRP `RenderMessage`、静默/对话 Agent、设置变更；稍后还有 Electron main IPC 与生态云同步。状态库所有者已是 zustand（ADR-0011 / libraries.md），禁止为「通信」再引入 redux / jotai / valtio / mobx。渲染区已有 CRP（ADR-0010）；布局比例已走 localStorage（ADR-0008），不能进通信层。无 Server Actions、无动态 Route Handler，会话态在客户端。

需要一条可执行边界：哪些状态私有、哪些只读跨域、哪些是单向消息；以及 IPC / 同步如何接到同一边界，而不是各自再拉一条总线。

## 面临的选项

- **A. 路由 lift state**：工作台变成上帝组件；ASR 回调与静默 Agent 不适合纯 props。
- **B. 通用 event bus 包**：mitt@3.0.1（功能发版停在 2023-07-04）、eventemitter3@5.0.4（2026-01-19 仍在发版）。字符串事件无当前值、难 exhaustive、与少依赖纪律冲突。
- **C. 单一 zustand 上帝 store**：消灭领域边界。
- **D. `features/*/public.ts` 互引**：把红线改成「只许引 public」，审计成本高、易循环依赖。
- **E. `src/lib/session` 三通道**：私有 store 留 feature；跨域只经 (1) zustand vanilla 公开只读切片 + `subscribeWithSelector`；(2) CRP 投影 store（按 id upsert/revoke）；(3) 自研封闭联合类型命令总线。组装根留在 `src/app/`。

2026-08-30 核实：zustand npm 最新 5.0.15；README 仍把组件外 `subscribe`、`subscribeWithSelector`、`createStore`（`zustand/vanilla`）与 React `useShallow`（`zustand/react/shallow`）列为一等 API。Electron 官方 IPC 教程 fiddle 标注 44.0.0：preload `contextBridge` 一方法一频道，双向用 `invoke`/`handle`，禁止暴露整个 `ipcRenderer`。

## 决定

**E**。

- 转写 partial、xyflow 坐标、API key、Agent 内存态：**领域私有**。
- `committedVersion` / `outlineDigest` / 配置版本号等：**公开只读切片**，仅拥有者 `writes/*` 可写；外域用 `getState` 或非 React `subscribe`，禁止 React 订阅 partial。
- `RenderMessage`：**CRP 投影**，不是 fire-and-forget 事件（需要更新/撤回）。
- 点思维导图回跳文稿、设置变更、会话重置：**命令** `transcript.scrollTo` 等 P0 封闭联合类型。
- **不引入** mitt / eventemitter3 / 其它 bus 包。
- Electron：feature 只对 `lib/db`、`lib/providers`、`lib/session`；`window.classoloAPI` 仅 `src/lib/platform/` 可触。IPC 频道按能力命名（`db:` / `notify:` / `asr-local:`），不把业务命令打进 main。
- 云同步：只发生在 `StorageProvider`；三通道仍是本机 UI 运行时。命令不落盘；hydrate 走 writer，不推翻 P0。

## 理由

红线约束的是模块依赖方向，不是「不能有共享契约」。契约放 `lib` 与 Provider 一致。三种载荷频率与生命周期不同，合成一条通用 bus 会把「当前值」和「副作用」混在一起。zustand 已豁免封装且 API 覆盖跨域订阅；CRP 已覆盖渲染。自研命令总线与封闭联合类型比再引入一个关注点所有者更短。点节点回跳是意图不是 notes 去读文稿滚动位置。

## 放弃了什么

通用 pub/sub 生态（mitt 的体积极小、eventemitter3 的 Node 兼容 API）；feature-level public barrel 互引的就近性；P0 的每会话 React context store（单课单例足够；P1 打开历史课再按 zustand 官方 context 配方升级，切片字段保持兼容）。

## 何时重审

- P1 需要同时打开「历史课 + 正在录的课」两个会话运行时。
- 压测表明 `committed[]` 全量切片过大，检索应改走 `lib/db`。
- 需要新增 `SessionCommand` variant 或第四条通道。
- 有人提议引入 event bus 包或第二个状态库。
- 生态多设备写冲突策略立项时（另开 ADR，不改本层总线）。
