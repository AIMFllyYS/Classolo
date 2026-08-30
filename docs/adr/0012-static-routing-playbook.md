# ADR-0012: 多静态路由 + Playbook 为动效/预设唯一目录

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia

## 背景

需在静态导出约束下提供工作台、设置、以及设计手册。动效与预设组件若散落在各 feature，后续无法统一手感和验收。

## 面临的选项

A. 单页 `page.tsx` 内切全部视图；B. 开放动态路由 `/session/[id]`；C. **封闭静态路由表 + `/playbook/**` 手册**。

## 决定

**C**。路径清单见 [routing.md](../conventions/routing.md)。Playbook 登记处：`src/features/playbook/registry.ts`。会话不进 URL。

## 理由

静态导出无法为无限 UUID 做 `generateStaticParams`；手册进正式路由才能逼业务复用同一套预设，而不是 `_dev/` 里自生自灭。

## 放弃了什么

单页信息架构的简单性；把 playbook 藏进 `_dev/`（生产构建会丢掉手册）。

## 何时重审

P1 若必须分享「某一课」的 URL，再评估封闭 id 列表或放弃静态导出（须新 ADR）。
