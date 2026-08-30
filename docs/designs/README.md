# docs/designs/

设计文档。

## 用途

存放架构设计和技术方案文档，包括：
- 系统架构设计（整体架构、模块划分、数据流）
- UI/UX 设计（页面布局、交互设计、组件设计）
- 技术方案（技术选型对比、方案决策记录）

## 现有文档

- [architecture-overview.md](./architecture-overview.md) — Classolo 总体架构（工作台布局、可插拔 Provider、本地数据、生态迁移路径）
- [render-module-protocol.md](./render-module-protocol.md) — 渲染区自定义组件协议（CRP）
- [feature-communication.md](./feature-communication.md) — Feature 间通信三通道（只读切片 / CRP 投影 / 命令总线；ADR-0017）
- `library-showcase/*.html` — Phase 3 选型对比页（六关注点 + 三轮 ASR 调研，双击即看；每页底部含决策历史）

## 文档结构模板

# [Design Title]

> Created: YYYY-MM-DD
> Updated: YYYY-MM-DD
> Status: draft | review | accepted | deprecated

## 问题陈述
[要解决什么问题]

## 方案对比
[列出多个候选方案及其优劣]

## 最终决策
[选择了哪个方案]

## 决策理由
[为什么选择这个方案]
