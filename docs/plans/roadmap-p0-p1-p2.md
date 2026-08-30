# Classolo P0 / P1 / P2 路线图

> Created: 2026-08-30
> Updated: 2026-08-30（选型终审后修订）
> Status: approved

总原则：**本地优先**。P0–P2 全程本地运行（自配 API + 本地存储 + Electron 打包 exe），并入 1037Solo 生态（统一登录/Supabase/邮件推送/宝塔 Web 版）是全部本地功能稳定之后的独立阶段。架构可插拔（见 [../designs/architecture-overview.md](../designs/architecture-overview.md)），选型决策链见 `../adr/`。

## P0 — 课堂工作台（最核心）

**目标**：上课打开即用——实时听课转文字、实时思维导图笔记、实时智能渲染。

### 布局
- [ ] 工作台四区框架：shadcn Resizable 嵌套分屏（导航可收起、比例可拖、localStorage 持久化）
- [ ] 电脑端优先、平板端友好；不做手机端

### 文稿区
- [ ] 录音控制（开始/暂停/结束）+ MediaRecorder/AudioWorklet 采集（16k PCM 重采样）
- [ ] ASR 适配器 ×3（ADR-0004）：realtime-ws（阶跃 + 百炼 dialect，默认）/ OpenAI 兼容 REST（含切片伪流式）/ sherpa-onnx 本地（Electron 阶段）
- [ ] 增量转写流展示（时间戳分段、自动滚动、可回看、断线重连）
- [ ] 预置学科热词表机制 + 设置页自定义

### 笔记区
- [ ] AI 增量整理转写 → 思维导图大纲（AI SDK `Output.object` 流式结构化输出）
- [ ] @xyflow/react + dagre 增量渲染（稳定 id diff、旧节点坐标保留、新节点动画进入、点击回跳文稿）

### 渲染区
- [ ] CRP 协议 + 模块注册表（ADR-0010，工具调用即渲染）
- [ ] P0 模块：image / rich-text / ai-ask / gen-ui（受控 DSL）/ agent-status

### Agent
- [ ] `src/lib/ai/` 接入（用户自配 OpenAI 兼容 key）
- [ ] 静默课堂 Agent：自研薄状态机，按语义段节流触发
- [ ] 可对话 Agent：`streamText` + reasoning 展示 + 文稿检索工具

### 基础设施
- [ ] PGlite + Drizzle 落地（会话/转写/笔记/设置表）+ **45-90 分钟写入压测**
- [ ] 设置页 v1：AI/ASR 协议族配置（自配 key）
- [ ] Electron 打包链路（静态导出 + app:// + electron-builder NSIS + electron-updater/GitHub Releases）

**P0 验收**：一节 45 分钟课全程录音不丢字；思维导图随讲随更不闪烁；静默 Agent 正确触发图片检索与补充讲解；除自配 AI/ASR API 外无网络依赖。

## P1 — 保存、复习站与通用 Agent

- [ ] **录音会话保存**：结束录音后像一次 AI 对话一样存入左侧导航栏历史
- [ ] **导航栏完整形态**：新录音 / 新对话 / 资源库 / 复习站 / 测试站 + 底部设置
- [ ] **新对话**：复习定位的 Agent 入口，工具：检索历史课堂录音、素材库教材检索、skills（借鉴 pi 的上下文工程实践）
- [ ] **知识清单自动生成**：录音结束自动整理为知识清单 + 知识卡片入资源库
- [ ] **复习站**：遗忘曲线（候选 ts-fsrs，届时按 Phase 3 流程调研）驱动复习进度与章节掌握度推送；本地系统通知
- [ ] **后台自动出题**：定时任务型 Agent 按知识点持续生成题目（`powerSaveBlocker` + 通知提醒勿关机）
- [ ] **题目模块化 Schema 落地**（[../specs/question-schema.md](../specs/question-schema.md)）
- [ ] **ASR 医学模式**：腾讯 `16k_zh_medical` 私有 WS 适配器（+讯飞可选）
- [ ] 通用智能体框架定型：出题/复习推送/课堂 Agent 全部复用 `src/lib/ai/` 一套

## P2 — 错题定位与押题

- [ ] **错题加固**：错题 → 知识点反向定位，自动生成加固题
- [ ] **学习进度画像**：章节/知识点掌握度追踪与可视化（recharts，生态沿用）
- [ ] **考期押题**：设置期中/期末时间；AI 持续分析考点，按月产出押题卷，考前数天/数周密集押题
- [ ] **素材库增强**：教材上传入库供 Agent 检索

## 生态接入期（最晚，独立于 P 级别）

- [ ] Storage → Supabase（表前缀 `cs_`，本地数据上云脚本）
- [ ] Auth → account.1037solo.com SSO（`client_id=classolo`）
- [ ] Mail → 生态共享邮件推送密钥
- [ ] Web 版宝塔部署（`classolo.1037solo.com.conf` nginx 反代 4070，参照 `1037Solo-Ecosystem/linux-bt/`）
- [ ] 会员/订阅对齐生态统一定价方案

## 里程碑顺序

P0 布局 → 文稿区 → 笔记区 → 渲染协议与模块 → Agent → Electron 打包 → P1 → P2 → 生态接入。
