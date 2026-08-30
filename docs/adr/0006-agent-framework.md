# ADR-0006: Agent 框架 —— Vercel AI SDK 唯一所有者

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 决策现场：`docs/designs/library-showcase/agent-framework.html`（两轮调研，含 Pi 消歧与深评）

## 背景

一套通用 Agent 框架复用三个角色：笔记整理器（流式结构化输出）、静默课堂 Agent（状态机 + 工具调用即渲染）、可对话 Agent（对话 + 思考 + 检索）。硬约束：OpenAI 兼容自配 baseURL、本地可跑、TS 原生。用户点名评估「前段时间很火的 PI Agent」。

## 面临的选项

- **ai@7.0.84（Vercel AI SDK）**：`createOpenAICompatible`、Zod tool、`Output.object` 流式结构化、reasoning 流、tool 无 execute 转发前端（Generative UI）、`useChat`；Apache-2.0，resolved 11
- **pi（earendil-works/pi，99k stars）**：消歧确认即用户所指；`pi-agent-core` 可嵌入（动态 tools、onUpdate、thinking），上下文工程（session 树/compaction/SKILL.md）是强项；但无结构化输出原语、TypeBox 非 zod、无 React hooks、文档面向 CLI、0.84.x 升级快、无非编码嵌入产品实例
- Mastra（unpacked ~63MiB、默认 PostHog 遥测）、LangGraph.js（P0 过重）、OpenAI Agents SDK（默认 tracing）

## 决定

**Vercel AI SDK（`ai` + `@ai-sdk/openai-compatible`）为唯一框架所有者**，封装层 `src/lib/ai/`。静默课堂 Agent 的状态机自研薄循环（内存态，P0 不需要可回放图）。pi 不进依赖树，P1 做 skills/上下文压缩时借鉴其实践。

## 理由

三个角色逐项一等原语覆盖（用户决策规则：AI SDK 能完美解决就用它）；「工具调用即渲染」与 tool 转发前端机制天然对齐。注意：**模型必须经 provider 实例创建，禁止字符串模型 ID**（会走 AI Gateway）。

## 放弃了什么

pi 的上下文工程开箱能力；LangGraph 的可暂停/回放（若 P1 后台 Agent 需要再评估）。

## 何时重审

静默 Agent 需要跨会话可恢复/可回放时；AI SDK 大版本升级时。
