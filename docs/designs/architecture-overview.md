# Classolo 总体架构设计

> Created: 2026-08-30
> Updated: 2026-08-30（Phase 3 选型终审后修订：选型定案、移除 EdgeOne、宝塔部署口径）
> Status: accepted

## 问题陈述

Classolo 是 1037Solo 生态的课堂赋能子项目（定位：一站式上课赋能平台，串联笔记、复习与本质思考）。它需要在两个目标间取得平衡：

1. **P0 快速可用**：完全本地运行（自配 API 密钥、本地存储），经 Electron 打包为桌面 exe，不依赖任何生态服务与云部署；
2. **后期平滑并入生态**：统一登录（account.1037solo.com）、共享 Supabase 数据库、共享邮件推送密钥、统一设计体系（StudySolo 令牌），且迁移时不允许大规模重构。

本文档定义总体架构与模块边界；具体选型的决策链见 `docs/adr/`（0001-0011），本文只引用结论。

## 一、工作台布局（P0 核心 UI）

终端适配原则：**电脑端优先，平板端其次，不做手机端**（`html { min-width: 768px }`）。

```
┌──────────┬─────────────────────────────┬─────────────────────────────┐
│          │                             │                             │
│  左侧     │        文稿区                │         笔记区               │
│  导航栏   │  （实时录音转文字）            │  （AI 实时思维导图笔记）        │
│          │                             │                             │
│  可收起   ├─────────────────────────────┼─────────────────────────────┤
│  比例可调 │        渲染区（左）           │         渲染区（右）           │
│          │  图片/富文本/Gen UI/AI 提问   │   静默 Agent 实时思考呈现      │
└──────────┴─────────────────────────────┴─────────────────────────────┘
```

- 分屏：shadcn Resizable（react-resizable-panels），嵌套水平+垂直，导航可收起，比例经 `useDefaultLayout` 持久化到 localStorage（ADR-0008）
- 文稿区顶部为录音控制条（开始/暂停/结束），正文为增量转写流
- 笔记区在录音进行中恒为思维导图形态（参考飞书妙记），录音结束后可切换视图
- P1 导航栏完整形态：顶部「新录音 / 新对话 / 资源库 / 复习站 / 测试站」，底部「设置」

## 二、分层与目录映射

```
src/app/                  路由层（薄，只做组装）
src/features/
  transcript/             文稿区：录音采集（MediaRecorder/AudioWorklet）、转写流状态
  notes/                  笔记区：增量大纲生成、思维导图渲染
  render-modules/         渲染区：CRP 协议模块（每模块一目录，互不 import）
  agent/                  课堂 Agent：对话/思考/工具调用；静默 Agent 薄状态机
  library/                资源库与录音会话保存（P1）
  review/                 复习站（P1）
  quiz/                   测试站（P1/P2）
  settings/               设置页：API 配置（协议族/密钥）、布局偏好
src/lib/
  providers/              可插拔 Provider 接口 + 实现（asr/ 已建骨架）
  ai/                     Vercel AI SDK 唯一入口
  db/                     PGlite + Drizzle 唯一入口
src/components/
  ui/                     shadcn 组件
  mindmap/                @xyflow/react 唯一入口
  layout/                 react-resizable-panels 唯一入口
  markdown/               streamdown 渲染管线入口
src/styles/               StudySolo 设计令牌（tokens.css）
electron/                 （打包阶段建）main/preload，与 src/ 隔离
```

依赖方向：`app → features → lib`。features 之间禁止横向 import（经 `src/lib/session/` 三通道，见 [feature-communication.md](./feature-communication.md)）。静态路径封闭清单见 [routing.md](../conventions/routing.md)。第三方领域库一律走封装层（`docs/libraries.md` 的"封装层入口"列）。

## 三、可插拔 Provider 架构（生态迁移的核心保险）

一切「后期会被生态接管」的能力都隔离在接口后面。P0 只写本地实现，**业务代码不得绕过接口直连具体实现**。

| Provider | P0 实现（本地） | 生态实现（最晚阶段） |
|---|---|---|
| `AuthProvider` | 单机匿名用户 | account.1037solo.com SSO（`client_id=classolo` + redirect） |
| `StorageProvider` | PGlite（Repository 层） | Supabase 共享库（表前缀 `cs_`） |
| `MailProvider` | Noop / 本地系统通知 | 生态共享邮件推送密钥 |
| `AIProvider` | 用户自配 OpenAI 兼容 key/baseURL | 生态自带 API（订阅额度） |
| `ASRProvider` | 6 协议族适配器（ADR-0004） | 同左（生态可代理计费） |

## 四、数据（ADR-0007 定案）

**PGlite ^0.5.8 + Drizzle 1.0 RC（pg-core）**。Postgres 方言与 Supabase 完全一致——迁移 = 换连接驱动 + `cs_` 前缀，schema/SQL 零重写。
持久化：开发期浏览器 IndexedDB + `relaxedDurability`；Electron 期移到 main process `userData` 文件库（IPC 供 renderer）。
写入策略：转写流先内存 ring buffer，按段批量 INSERT。**P0 早期必须做一次 45-90 分钟课的写入压测**。

## 五、AI 与 Agent（ADR-0006 定案）

框架唯一所有者：**Vercel AI SDK**（`ai` + `@ai-sdk/openai-compatible`），入口 `src/lib/ai/`。三个角色复用：

1. **笔记整理器**：`Output.object` + `partialOutputStream` 增量输出思维导图大纲
2. **静默课堂 Agent**：自研薄状态机（内存态、按语义段节流触发），工具调用即渲染——CRP 模块 manifest 自动注册为 Agent tool，调 tool = 发 RenderMessage（ADR-0010）
3. **可对话 Agent**：`streamText` + reasoning parts + 检索真实转写文稿的工具

硬规则：模型必须经 `createModel()` 实例创建，禁止字符串模型 ID（会走 AI Gateway）。pi（earendil-works）不进依赖树，P1 做 skills/上下文压缩时借鉴其实践。

## 六、ASR（ADR-0004 定案）

统一 `ASRProvider` 接口（`start/sendAudio/stop` + `onPartial/onFinal` + capabilities），6 协议族。P0 三个适配器：

1. `realtime-ws`（**上课默认**）：阶跃 `stepaudio-2.5-asr-stream`（1.2 元/h）+ 百炼 `qwen3-asr-flash-realtime`（1.19 元/h），双 dialect
2. `transcriptions-rest`：一切 OpenAI 兼容文件端点 + 切片伪流式降级（UI 标注"准实时"，不进上课默认）
3. `local-engine`：sherpa-onnx 离线免费兜底（Electron 阶段接入）

医学热词：预置学科热词表随请求注入 + 设置页自定义。腾讯医学引擎/讯飞 → P1「医学模式」。Web Speech API 在 Electron 不可用，永不作为实现。

## 七、Electron 桌面端（ADR-0009 定案）

- Next.js `output: 'export'` 静态导出 + **`app://` 特权自定义协议**（禁 file://）加载
- **electron-builder（钉 v26 dist-tag）NSIS + electron-updater**，更新托管 GitHub Releases；签名 P0 不做
- 系统能力全部在 main process（麦克风权限、系统通知 `setAppUserModelId`、PGlite 落盘、`powerSaveBlocker`），IPC 供 renderer
- **禁止新增动态 Route Handler / Server Action**（静态导出不支持）
- Node ≥22.12（Electron 44 要求）

## 八、部署口径（ADR-0002 定案）

**本项目无云部署。** P0-P2 交付物 = 本地 dev（端口 4070）+ Electron exe。生态接入期的 Web 版走 1037Solo 统一的**宝塔自部署**（`1037Solo-Ecosystem/linux-bt/` 模式：`classolo.1037solo.com.conf` nginx 反代 4070 服务）。禁止引入 EdgeOne/Vercel 等云平台专属配置。

## 九、迁移路径（本地 → 生态）

1. P0/P1/P2 全程本地：`LocalAuth + PGlite + Noop 邮件 + 自配 AI/ASR`
2. 生态接入期（最晚）：Storage → Supabase（`cs_` 前缀 + 本地数据上云脚本）；Auth → SSO；Mail → 生态密钥；Web 版宝塔部署
3. 迁移唯一改动面 = Provider 工厂配置 + 新增生态实现，业务代码零改动（架构红线）

## 风险

- PGlite 高频写入性能（压测 + ring buffer 缓解，回退方向 better-sqlite3）
- 静默 Agent 调用频率与成本（按语义段节流，禁止按句触发）
- 阶跃/百炼 Realtime 方言差异（`delta` 语义不同：阶跃是累计全量 + stash），适配器内消化，禁止漏到业务层
