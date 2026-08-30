# 代码风格规范

> `AGENTS.md` Critical Rules 的展开。写业务代码前若对风格有疑问读本文；长度与放置见 [code-size-and-organization.md](./code-size-and-organization.md)；Next 框架行为见 [nextjs-16-patterns.md](./nextjs-16-patterns.md)。

## 组件与渲染

- 默认 Server Component，仅需要交互 / 浏览器 API 时加 `'use client'`
- `'use client'` 放叶子组件，不放页面级
- 工作台、思维导图、录音控件这类必然客户端的模块，在 feature 叶子组件加 `'use client'`，路由 `page.tsx` 只做组装
- 命名导出优先；`page` / `layout` / `error` / `loading` / `not-found` 除外（Next 要求默认导出）
- 重型客户端库（xyflow、PGlite）经封装层 `next/dynamic` 懒加载，避免把整页打成客户端

## TypeScript

- strict mode，禁止 `any`，用 `unknown` + 类型收窄
- 渲染模块 props、ASR 配置、题目结构用 zod schema 作运行时边界

## 样式

- Tailwind CSS v4 + `src/styles/tokens.css` 语义变量（`--primary`、`--foreground` 等）
- 禁止硬编码品牌色、禁止另起色板、禁止 CSS Modules（除非覆盖第三方组件）
- 条件 className 用项目内 `cn()`（`clsx` + `tailwind-merge`），不在业务里直接拼字符串堆

## 封装与 Provider

- 第三方领域库只从 [docs/libraries.md](../libraries.md) 的「封装层入口」import
- Auth / Storage / Mail / AI / ASR 只走 `src/lib/providers/`（AI 的 SDK 入口是 `src/lib/ai/`）
- 禁止字符串模型 ID 调 AI SDK（会走 AI Gateway）；必须经 `createModel()`

## 质量

- 改动后 `pnpm lint` 与 `pnpm tsc --noEmit` 必须通过（Definition of Done）
- **P0 不强制单测**：仓库尚未选定测试框架。需要回归的纯函数可先放 `_dev/` 或本地点验；引入测试栈须走依赖纪律 + ADR

## Playbook 与 _dev/

- 共享动效 / 预设 UI / CRP 演示只进 `/playbook/**` 与 `src/features/playbook/registry.ts`（[routing.md](./routing.md)）
- `_dev/` 仅一次性实验；验证完迁入 Playbook 再删实验页

## _dev/ 调试区

- 调试 / 原型放 `src/app/_dev/`，不进正式路由
- 每页顶部：`if (process.env.NODE_ENV === 'production') notFound()`
- `_dev/` 可引用正式组件；正式代码不得引用 `_dev/`
- 调试完成后迁到正式路由并清理调试页
