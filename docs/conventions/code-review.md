# Code Review 检查清单

> 做 code review 或自我审查时按本清单逐项检查（对应 AGENTS.md Documentation Index「Code review 时」）。

## 文件组织与职责

- 文件 / 函数是否过长且未按职责拆分（看职责混杂与自然接缝，不看行数本身）
- 放置是否符合 colocation：单路由专用代码是否被错误提升到 `src/features/`；跨路由领域是否还散落在路由里
- 领域库是否绕过封装层（对照 [docs/libraries.md](../libraries.md)）

## Next.js 16 合规

- `'use client'` 是否只在叶子组件
- 若页面使用 `params` / `searchParams`，是否已 `await`
- 是否出现 `middleware.ts`、`pages/`、动态 `route.ts`、Server Actions（一律否决）
- `next.config.ts` 是否仍是 `output: 'export'` + `images.unoptimized` + `trailingSlash`

## 静态导出 / Electron（ADR-0002 / 0009）

- `public/` 是否塞入大文件
- 系统能力是否误放进 Next 服务端（应走 Electron main + IPC）
- 是否引入 EdgeOne / Vercel 等云平台专属配置
- 资源路径是否写死绝对域名（须兼容 `app://`）

## Classolo 专项

- 是否新增了 routing.md 未登记的页面，或共享动效未进 Playbook registry
- 是否绕过 `resolveSecret()` 直接读环境变量密钥
- 渲染模块之间是否横向 import（只允许依赖 `types.ts` / `src/lib` / `src/components/ui`）
- 业务是否绕过 Provider 直连厂商 SDK / 裸 `ai` / 裸 `@electric-sql/pglite`
- 是否硬编码品牌色（应引用 `src/styles/tokens.css` 语义变量）
- AI 调用是否使用字符串模型 ID（禁止，须 `createModel()`）

## _dev/ 隔离

- `_dev/` 页是否有 `NODE_ENV === 'production'` 守卫
- 正式代码是否引用了 `_dev/`
