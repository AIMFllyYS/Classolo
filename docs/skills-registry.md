# skills 注册表 — Classolo

> 本项目可引用的 skills 及强制调用时机。创建 issue / 拆 issue / 提 PR 前**必须查本表**并调用对应 skill；issue/PR 正文注明引用了哪些 skill。

| skill | 用途 | 何时必须调用 | 引用要求 |
|---|---|---|---|
| `/claude:issue-creator` | 创建与拆解 issue（双层信息架构、sub-issue 规范） | 创建 issue / 拆 issue / 建子 issue 时 | issue 正文注明 |
| `/agents:issue-to-pr` | issue 驱动开发与 PR 创建（PR-issue 关联规范） | 根据 issue 做 PR / issue 驱动开发时 | PR 正文注明 |
| demo-init | 项目初始化（本项目由它生成，`D:\projects\My-Skills\demo-init`） | 仅初始化时；日常开发不调用 | — |

## 自定义

用户可随时增删各方向常用 skill；变更走批量结算确认后更新本表。绑定的 skill 本体不在本仓库内维护，本表只登记引用关系与调用时机。
