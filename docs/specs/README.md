# docs/specs/

技术规格说明。P0 **没有**对外 HTTP API；规格写的是协议、数据形状与模块边界。

## 用途

- 模块 / 协议规格（CRP、ASR 协议族能力声明）
- 数据结构规格（题目 schema、日后知识卡片）
- 功能验收口径（可与 roadmap 勾选对照）

HTTP 接口规格仅在生态接入期（宝塔 Web 版）若出现服务端时再新增。

## 现有文档

- [local-schema.md](./local-schema.md) — P0 本地表（软约束，改表先改本文）
- [secrets-resolution.md](./secrets-resolution.md) — 密钥优先级：用户配置 > env
- [question-schema.md](./question-schema.md) — 题目模块化 JSON Schema（P1 draft）

P0 协议正文目前在设计文档，不重复拷贝：

- 渲染协议 → [../designs/render-module-protocol.md](../designs/render-module-protocol.md)
- Feature 通信 → [../designs/feature-communication.md](../designs/feature-communication.md)
- ASR 协议族 → [../adr/0004-asr-universal-access.md](../adr/0004-asr-universal-access.md)
- 路由表 → [../conventions/routing.md](../conventions/routing.md)

## 文档结构模板

```
# [Spec Name]

> Created: YYYY-MM-DD
> Updated: YYYY-MM-DD
> Status: draft | review | approved

## 背景
## 目标
## 方案
## 风险
```
