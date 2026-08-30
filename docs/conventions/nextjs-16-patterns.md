# Next.js 16.2+ 关键模式与陷阱

> 写 Next.js 路由 / 配置前必读。Next 16 与训练数据可能不一致，以本文为准。
> **本项目是静态导出 + Electron（ADR-0009）**：先看「本项目裁剪」，再看通用 16.x 条目。

## 本项目裁剪（静态导出下不要做）

以下能力在 `output: 'export'` 下不可用或无意义，**禁止为此新增文件**：

| 能力 | 本项目做法 |
|---|---|
| 动态 Route Handler（`app/api/**/route.ts`） | 禁止。系统能力走 Electron main + IPC |
| Server Actions | 禁止 |
| `middleware.ts` / 默认的 `proxy.ts` | **P0 不要创建**。静态页无请求拦截需求；禁止用 `middleware.ts`（已废弃） |
| `cookies()` / `headers()` / `draftMode()` | 桌面包无 Cookie 会话；设置存在 PGlite / localStorage |
| Partial Prerendering（`cacheComponents`） | 不开启。与静态导出目标无关 |
| `adapterPath` / Edge / Cloud Functions | 禁止。无云部署（ADR-0002） |

`params` / `searchParams` 若出现在页面签名上，仍须 `await`（Next 16 强制）。**只允许 [routing.md](./routing.md) 登记的静态路径**，禁止开放动态段。

## proxy.ts 替代 middleware.ts（仅当离开静态导出时）

生态期若 Web 版改为有 Node 服务端：

- 文件名是 `proxy.ts`，不是 `middleware.ts`
- 导出 `proxy` 函数，不是 `middleware`
- 运行时固定 `nodejs`，不支持 `edge`
- `skipMiddlewareUrlNormalize` 已改名 `skipProxyUrlNormalize`

P0–P2 桌面路径不需要这一步。

## Async Request APIs（强制异步）

`params`、`searchParams`、`cookies()`、`headers()`、`draftMode()` 在 Next.js 16 中**必须 `await`**：

```ts
// ✅ correct
export default async function Page({ params }: PageProps) {
  const { slug } = await params
}

// ❌ wrong — will throw at runtime
export default function Page({ params }: PageProps) {
  const { slug } = params
}
```

## Turbopack 是默认构建器

- `pnpm dev` 和 `pnpm build` 默认 Turbopack，无需 `--turbopack`
- 自定义 `webpack` 配置会导致构建失败 → 迁到 Turbopack 选项，或 `--webpack` 回退
- 原生模块 / WASM（PGlite、日后 sherpa-onnx）若与 Turbopack 冲突，先记 lessons，再考虑 `--webpack`，不要先改 `next.config` 加 webpack 块

## Static Export (SSG) 配置

`next.config.ts` 必须包含：

```ts
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}
```

- 输出目录是 `out/`（Electron 加载这份静态资源），不是把 `.next/` 当桌面包
- `trailingSlash: true` 为 `app://` 目录结构服务
- Dev 端口固定 **4070**（`package.json` 的 `next dev -p 4070`）

## 其他约定

- `error.tsx` 必须是 Client Component（`'use client'`）
- 禁止 `route.ts` 与 `page.tsx` 同目录共存——本项目直接禁止 `route.ts`
- `generateStaticParams()` 仅当确有静态动态段时使用
- `metadata` / `generateMetadata()` 替代旧版 `head.tsx`
- `next/link` 的 `transitionTypes` 支持 View Transitions（16.2+）；工作台内导航优先客户端状态，少做多页面跳转
