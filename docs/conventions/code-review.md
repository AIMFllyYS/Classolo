# Code Review 检查清单

> 本文档是 `AGENTS.md` 中 "When Reviewing Code" 的完整版。
> AI 编码代理在进行 code review 或自我审查时按本清单逐项检查。

## 文件组织与职责

- 检查文件/函数是否过长且未按职责拆分（关注职责混杂与自然接缝，而非行数本身）
- 检查文件放置是否符合 colocation 原则：单路由专用代码是否被错误地提升到 `src/features/`（应留在路由内）；跨路由领域模块是否还散落在各路由里（应提升到 `src/features/`）

## Next.js 16 合规

- 检查是否有 `'use client'` 被过度使用（应只在叶子组件）
- 检查 `params` / `searchParams` 是否正确 `await`
- 检查是否有 `middleware.ts` 残留（应为 `proxy.ts`）
- 检查 `next.config.ts` 是否包含 `output: 'export'` + `images.unoptimized` + `trailingSlash`

## 静态导出 / Electron 合规（本项目无云部署，ADR-0002/0009）

- 检查是否有大文件被放入 `public/`
- 检查是否新增了动态 Route Handler / Server Action（静态导出不支持，系统能力走 Electron main + IPC）
- 检查是否引入了 EdgeOne / Vercel 等云平台专属配置（禁止）
- 检查资源路径是否兼容 `app://` 自定义协议加载（避免绝对域名硬编码）

## Classolo 专项

- 检查第三方领域库是否绕过封装层直接 import（对照 `docs/libraries.md` 封装层入口列）
- 检查渲染模块（`src/features/render-modules/`）之间是否出现横向 import
- 检查是否硬编码品牌色（应引用 `src/styles/tokens.css` 语义变量）

## _dev/ 隔离

- 检查 `src/app/_dev/` 页面是否有 `NODE_ENV === 'production'` 守卫
- 检查是否有正式代码引用了 `src/app/_dev/` 中的内容（应单向引用）
