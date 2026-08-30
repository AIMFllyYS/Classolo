# 路由与 Playbook 规范

> Created: 2026-08-30
> 决策：[ADR-0012](../adr/0012-static-routing-playbook.md)
> 写新页面 / 动效 / 预设组件前必读。

## 统一路由表（封闭清单）

本项目是 `output: 'export'` + `trailingSlash: true`。**只允许下表中的静态路径**。新增路由 = 先改本表（批量结算）再加 `src/app/.../page.tsx`。禁止 `src/app/**/[id]/` 这类开放动态段（会话是客户端状态，不是 URL 资源）。

| 路径 | 页面 | 阶段 |
|---|---|---|
| `/` | 课堂工作台 | P0 |
| `/settings/` | 设置（密钥、ASR 协议族、热词、主题） | P0 |
| `/playbook/` | 组件与动效手册首页 | P0 |
| `/playbook/ui/` | UI 预设演示 | P0 |
| `/playbook/motion/` | 动效预设演示 | P0 |
| `/playbook/modules/` | CRP 渲染模块演示 | P0 |
| `/library/` | 资源库 | P1，未建页面前禁止先写死导航 |
| `/review/` | 复习站 | P1 |
| `/quiz/` | 测试站 | P1 |

链接一律带尾斜杠，与 `trailingSlash` 一致。路由文件只做组装，业务在 `src/features/`。

## Playbook 是动效与预设的唯一目录

- **所有共享动效、可复用前端预设、CRP 模块的可视化样例** 只登记在 `src/features/playbook/registry.ts`，演示只挂在 `/playbook/**`。
- 业务 feature 通过 **preset id** 引用，不复制一份「稍微改过的」动画参数。
- 新增渲染模块：实现仍在 `src/features/render-modules/<name>/`，同时在 registry 的 `modulePresets` 加一行，并在 `/playbook/modules/` 可看到。

## Playbook vs `_dev/`

| | Playbook | `_dev/` |
|---|---|---|
| 目的 | 长期手册，规范的一部分 | 一次性实验 |
| 是否进正式路由表 | 是 | 否 |
| production | 打进静态导出（桌面里可从设置进入） | `notFound()` |
| 引用方向 | 业务可引用 registry id | 正式代码禁止引用 `_dev/` |

实验动效验证完：迁入 registry + playbook 页，删掉 `_dev/` 页。

## 禁止

- 为「方便调试」在工作台页内嵌一套和第二套按钮样式
- 不改本表就新增 `src/app/foo/page.tsx`
- 用 `searchParams` 模拟多页面信息架构（可以给 playbook 过滤，但产品导航必须是上表路径）
