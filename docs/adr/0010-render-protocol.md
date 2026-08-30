# ADR-0010: 渲染区组件协议 —— 自研 CRP（工具调用即渲染）

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）

## 背景

文稿区/笔记区下方各一渲染区，实时渲染自定义组件（图片检索/富文本补充/AI 提问/Gen UI/Agent 状态）。用户核心要求：制定协议、每个组件独立模块、互不耦合、改一个不影响其他。

## 面临的选项

A. 自研协议（CRP：`RenderMessage{id, module, version, target, props, meta}` + 模块注册表）；B. 直接用 AI SDK Generative UI 机制裸奔（无协议层，模块边界靠自觉）。

## 决定

**A，自研 CRP**，但与 AI SDK 打通：`src/features/render-modules/registry.ts` 把每个模块 manifest（zod schema + 工具描述）自动注册为 Agent tool——Agent 调 tool = 发一条 RenderMessage。模块结构：`<name>/{manifest.ts, Component.tsx, index.ts}`，模块间禁止横向 import，只依赖 `types.ts`。Gen UI 模块 = 受控 DSL + 白名单组件集，禁止 AI 生成任意代码执行。P0 模块：image / rich-text / ai-ask / gen-ui / agent-status。

## 理由

协议层是"新增渲染能力 = 新增目录 + 注册一行"的保证；zod schema 校验失败渲染兜底错误卡片，单模块故障不崩渲染区。

## 放弃了什么

无协议的灵活性；AI 生成任意 JSX 的表现力（安全/稳定性不可接受）。

## 何时重审

协议 version 字段升级出现破坏性需求时（先加 dialect，禁止直接改已发布 schema）。
