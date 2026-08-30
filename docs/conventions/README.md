# docs/conventions/

项目规范、编码约定、架构规范。

## 用途

给 **AI 与人类同一套口径**。`AGENTS.md` 只保留硬规则 + 触发条件；满足触发条件时必须先读本目录对应文档，再动手。

本目录**不**另写 HTTP API 规范（P0 无 HTTP API）。Git 规范见 [git-github.md](./git-github.md)。

## 现有文档

| 文档 | 何时读 |
|---|---|
| [routing.md](./routing.md) | 新增页面、动效、预设组件 |
| [git-github.md](./git-github.md) | 分支、PR、CI |
| [project-structure.md](./project-structure.md) | 新建目录、纠结文件放哪、想加 `api/` 或 Server Action 时 |
| [code-size-and-organization.md](./code-size-and-organization.md) | 写长文件、要不要提升到 `features/` |
| [nextjs-16-patterns.md](./nextjs-16-patterns.md) | 写路由 / `next.config` / 以为需要 middleware 时 |
| [code-style.md](./code-style.md) | 组件、`'use client'`、样式、封装层、测试口径 |
| [code-review.md](./code-review.md) | Review 或自我审查 |

## 与 AGENTS.md 的关系

AGENTS.md 是索引。本目录是展开。两者冲突时以 **ADR + libraries.md + 较新的 conventions** 为准，并开批量结算修正另一份，禁止长期双口径。
