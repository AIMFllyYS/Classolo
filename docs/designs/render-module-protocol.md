# 渲染模块协议（Classolo Render Protocol, CRP）

> Created: 2026-08-30
> Updated: 2026-08-30
> Status: accepted

## 问题陈述

文稿区与笔记区下方各有一个「渲染区」，需要根据课堂内容实时渲染多种自定义组件（图片检索结果、富文本、AI 提问/补充讲解、生成式 UI 等）。要求：

1. 每个自定义组件独立成模块，**互不耦合**——修改某个模块不影响其他模块、不担心跨模块影响；
2. 渲染本质上是「Agent 调用工具」的一次输出，协议要与 Agent 工具调用机制天然对齐；
3. 新增一种渲染能力 = 新增一个模块目录 + 注册一行，不改动任何现有模块。

## 协议消息格式

Agent（或系统）向渲染区投递 `RenderMessage`，渲染区按注册表分发：

```ts
interface RenderMessage<P = unknown> {
  id: string                     // 消息唯一 ID（可用于更新/撤回已渲染块）
  module: string                 // 模块名，如 'image' | 'rich-text' | 'ai-ask' | 'gen-ui'
  version: string                // 模块协议版本，如 '1.0'
  target: 'transcript' | 'notes' // 投递到哪个渲染区（文稿区下方 / 笔记区下方）
  props: P                       // 模块自定义 props，由模块 schema 校验
  meta: {
    createdAt: number
    source: 'silent-agent' | 'chat-agent' | 'system'
    transcriptAnchor?: string    // 关联的文稿片段 ID（点击可回跳）
  }
}
```

## 模块结构

每个模块是 `src/features/render-modules/<name>/` 下的一个自包含目录：

```
render-modules/
  <name>/
    manifest.ts     # 模块名、版本、props 的 zod schema、Agent 工具描述
    Component.tsx   # 渲染组件（'use client' 叶子组件）
    index.ts        # 导出 manifest + Component
  registry.ts       # 唯一的汇聚点：import 各模块并注册
  types.ts          # RenderMessage 等协议类型（模块只依赖此文件）
```

硬性规则：

- 模块之间**禁止相互 import**；模块只能 import `types.ts` 与 `src/lib`、`src/components/ui`
- props 必须过 manifest 中的 zod schema 校验，校验失败渲染兜底错误卡片（不崩整个渲染区）
- 模块内部状态自管理，通过 `transcriptAnchor` 与文稿联动，不直接读其他 feature 的 store

## 工具即渲染（与 Agent 框架的对齐）

`registry.ts` 在注册渲染模块的同时，把每个 manifest 自动转换为 Agent 的一个 tool 定义：

```
manifest.toolName        → Agent tool 名称（如 render_image）
manifest.description     → tool 描述（何时应该调用）
manifest.propsSchema     → tool 入参 JSON Schema
tool 执行                 → 产出一条 RenderMessage 投递到渲染总线
```

因此「静默 Agent 决定检索一张医学解剖图」=「Agent 调用 `render_image` 工具」=「image 模块收到一条协议消息并渲染」。新增渲染能力对 Agent 而言只是多了一个可用工具。

## P0 内置模块清单

| 模块 | target | 用途 |
|---|---|---|
| `image` | 双区 | AI 状态机判定需要真实图片（医学等学科）时检索并渲染图片 |
| `rich-text` | 双区 | 富文本补充讲解（老师讲得不清晰时 AI 自动补充） |
| `ai-ask` | transcript | AI 主动提问卡片（随堂思考题） |
| `gen-ui` | 双区 | 生成式 UI（类 Claude 网页的理解辅助可视化组件） |
| `agent-status` | notes | 静默 Agent 实时思考状态呈现 |

## 风险

- Gen UI 模块若允许 AI 生成任意 JSX 存在安全/稳定性风险 → P0 限定为「受控 DSL + 白名单组件集」，不做任意代码执行
- 协议版本演进：`version` 字段 + 模块内向后兼容解析，禁止破坏性修改已发布 schema
