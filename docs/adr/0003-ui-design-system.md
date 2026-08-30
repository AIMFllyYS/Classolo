# ADR-0003: UI 基础与设计体系 —— shadcn/ui + StudySolo 生态令牌

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）

## 背景

1037Solo 生态需要全局色系统一。用户指定完整参考 StudySolo（`StudySolo-Dev/frontend`）的整体设计（日夜双主题 CSS）。

## 面临的选项

A. account.1037solo.com 的 Google 风格蓝色系；B. StudySolo 的 shadcn 令牌体系（深空暗色默认 #6366f1 靛蓝 + 暖纸浅色 #4f46e5）。

## 决定

**B（用户明确指定）**。完整移植 StudySolo 的 `tokens.css`（`@theme inline` + `.dark`/`.light` 双主题 + 语义变量），UI 组件 = shadcn/ui + radix-ui + Tailwind v4 + tw-animate-css；字体 @fontsource 本地（Inter + Noto Sans SC/Serif SC + JetBrains Mono）；状态 zustand；图标 lucide；通知 sonner；动画 framer-motion——全部沿用 StudySolo 已验证组合。

## 理由

生态风格一致性与统一性；同栈复用 StudySolo 的实战经验；shadcn 组件（含 Resizable）与选型直接衔接。

## 放弃了什么

Google 风格色板（account 站视觉不作为基准）；自定义课堂专属配色。

## 何时重审

生态推出统一 Design System 包时。
