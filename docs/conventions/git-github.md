# Git 与 GitHub 协作规范

> Created: 2026-08-30
> 决策：[ADR-0015](../adr/0015-git-github-workflow.md)
> 仓库：https://github.com/AIMFllyYS/Classolo （public，`main` 为默认分支）

## 分支模型

| 分支 | 角色 |
|---|---|
| `main` | 稳定 / 可发布。禁止日常直推。 |
| `dev` | 集成开发。功能分支合入这里。 |
| `feat/<slug>` `fix/<slug>` `chore/<slug>` | 从 **dev** 拉出，PR 打回 **dev**。 |

发版：`dev` → `main` 的 PR（squash 或 merge 均可，默认 squash）。禁止 force push 到 `main` / `dev`。

## Commit

Conventional Commits：`type(scope): description`。PowerShell 下多行说明用 `git commit -F <file>`，不用 bash heredoc。

## Issue / PR

创建 issue、拆 issue、按 issue 做 PR 前必须查 [skills-registry.md](../skills-registry.md) 并调用对应 skill；正文写明引用了哪些 skill。使用仓库内 GitHub 模板。

## CI

`.github/workflows/ci.yml`：对打向 `main` 与 `dev` 的 push/PR 跑 `pnpm lint` 与 `pnpm tsc --noEmit`。CI 未绿禁止合入。本地至少同样两项通过（Definition of Done）。

## 保护规则（人工在 GitHub 打开，见 ADR-0015）

- `main`：不允许直推；要求 PR；要求 CI 通过
- `dev`：尽量要求 PR；允许维护者短时直推初始化，稳定后收紧
