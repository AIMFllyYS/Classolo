# 题目模块化 JSON Schema

> Created: 2026-08-30
> Updated: 2026-08-30
> Status: draft（P1 落地前细化）

## 背景

P1/P2 的测试站需要：后台 Agent 自动出题、错题加固、押题卷。用户核心要求：题目模块化设计（一题一模块、含子模块），评分标准与规则前置定义，且题目必须能**反向定位知识点**（通过错题判断薄弱知识点，驱动遗忘曲线复习）。

## 目标

1. 一套 zod schema 定义所有题型，AI SDK `Output.object` 可直接按 schema 生成题目
2. 每题强制携带知识点标签，支撑「错题 → 知识点 → 加固题」闭环
3. 题型可扩展：新增题型 = 新增子 schema + 评分器，不改已有题型

## 方案（骨架）

```ts
interface Question {
  id: string
  type: 'single-choice' | 'multi-choice' | 'fill-blank' | 'subjective' // 可扩展
  stem: string                    // 题干（markdown，可含 katex 公式）
  payload: ChoicePayload | BlankPayload | SubjectivePayload // 按 type 判别联合
  scoring: {
    maxScore: number
    rubric: string                // 评分标准（主观题给 AI 判分用；客观题为答案匹配规则）
    partialCredit: boolean        // 多选/填空是否给部分分
  }
  knowledge: {
    points: string[]              // 知识点 ID（关联知识卡片）
    sessionId: string             // 来源课堂会话
    transcriptAnchor?: string     // 出题依据的文稿片段（可回溯）
    examWeight?: number           // 押题权重（AI 判断的考点概率 0-1）
  }
  srs: {
    difficulty: number            // 出题时预估难度 1-5
    // 复习调度字段由 SRS 引擎（P1 选型，候选 ts-fsrs）在答题记录表维护，不冗余在题目上
  }
  meta: { createdAt: number; generator: 'background-agent' | 'reinforce' | 'mock-exam' }
}
```

- 客观题（选择/填空）本地判分；主观题走 AI 判分（rubric 注入 prompt，输出得分 + 逐点评语）
- 答题记录独立成表（`attempts`）：题目 id、用户答案、得分、错因标签 → 反向更新知识点掌握度
- 押题卷 = `mock-exam` 生成器按 `examWeight` 与遗忘曲线状态组卷

## 风险

- 主观题 AI 判分一致性（同卷同 rubric 需温度 0 + 结构化输出约束）
- 知识点 ID 体系要先于题目生成定稿（P1 知识清单功能先行）
