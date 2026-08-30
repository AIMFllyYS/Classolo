# ADR-0015: GitHub 闭环 —— main / dev + CI

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia

## 背景

仓库已公开（AIMFllyYS/Classolo）。AGENTS 写了「PR 过 CI」，但没有分支模型和流水线，规则是空的。

## 面临的选项

A. 只用 `main`；B. GitFlow 全套（release/hotfix）；C. **`main` + `dev` + 短前缀功能分支**。

## 决定

**C**。规范：[git-github.md](../conventions/git-github.md)。CI：lint + tsc。Issue/PR 模板绑定 skills-registry。

## 理由

两人以上（含多 Agent）需要集成分支；桌面发布需要一条受保护的 `main`。完整 GitFlow 对当前团队过重。

## 放弃了什么

把 `dev` 当默认分支（GitHub 默认保持 `main`，避免 clone 的人找不到稳定点）。

## 何时重审

出现固定发版节奏或需要 `release/*` 时。
