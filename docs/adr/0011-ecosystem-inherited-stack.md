# ADR-0011: 生态沿用组 —— 流式渲染/状态/图标/通知/动画/字体

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）

## 背景

StudySolo（同生态、同为 Next.js 16 + React 19 + Tailwind v4）已实战验证一组基础库。Classolo 为保证生态一致性与经验复用，不重新调研直接沿用。

## 面临的选项

逐项重新调研 vs 沿用生态已验证组合（Phase 1「已有约定」原则：以用户/团队既有为准）。

## 决定

沿用：**zustand**（状态）、**streamdown + react-markdown + remark-gfm/math + rehype-katex + katex + shiki**（流式 Markdown/富文本/公式/代码高亮——AI 流式输出与渲染区 rich-text 模块直接受益）、**lucide-react**（图标）、**sonner**（通知）、**framer-motion**（微交互动画）、**@fontsource-variable** 本地字体（Inter/Noto Sans SC/Noto Serif SC/JetBrains Mono，不走 Google CDN）。版本跟随 StudySolo 的 range。

## 理由

同生态同栈，风格与行为一致；这组库在 StudySolo 处于生产状态，坑已被踩过。

## 放弃了什么

为 Classolo 单独优化选型的可能（如更轻的 markdown 管线）——一致性优先。

## 何时重审

StudySolo 升级/更换某项时同步评估。
