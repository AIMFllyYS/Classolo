# 项目结构与文件组织

> 本文档是 `AGENTS.md` 中 "Project Structure" 的完整版。
> 文件放置的详细规则（colocation 原则、`src/features/` 提升条件）见 [code-size-and-organization.md](./code-size-and-organization.md)。
> 依赖入口以 [docs/libraries.md](../libraries.md) 为准；架构边界见 [architecture-overview.md](../designs/architecture-overview.md)。

## 完整目录结构

```
.
├── src/
│   ├── app/                         # 路由层：只放路由文件，不放业务逻辑
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # 工作台 /
│   │   ├── settings/page.tsx        # /settings/
│   │   ├── playbook/                # /playbook/ + ui/motion/modules
│   │   ├── globals.css
│   │   └── _dev/                    # 一次性实验；production notFound()
│   ├── components/
│   │   ├── ui/                      # shadcn 纯 UI（无业务）
│   │   ├── layout/                  # react-resizable-panels 唯一入口
│   │   ├── mindmap/                 # @xyflow/react 唯一入口
│   │   └── markdown/                # streamdown 管线入口（待建）
│   ├── features/                    # 业务领域（跨路由复用才提升）
│   │   ├── transcript/              # 文稿区：录音采集、转写流
│   │   ├── notes/                   # 笔记区：大纲、思维导图
│   │   ├── render-modules/          # CRP 渲染模块（互不横向 import）
│   │   ├── agent/                   # 课堂 / 静默 Agent
│   │   ├── settings/                # 设置页
│   │   ├── playbook/                # 动效/预设登记（registry.ts）
│   │   ├── library/                 # 资源库（P1）
│   │   ├── review/                  # 复习站（P1）
│   │   └── quiz/                    # 测试站（P1/P2）
│   ├── lib/
│   │   ├── providers/               # Auth/Storage/Mail/AI/ASR/secrets
│   │   │   └── asr/                 # 协议族适配器（ADR-0004）
│   │   ├── session/                 # feature 跨域三通道（ADR-0017）
│   │   ├── ai/                      # Vercel AI SDK 唯一入口
│   │   ├── db/                      # PGlite + Drizzle 唯一入口
│   │   ├── theme/                   # 跟随系统主题启动脚本
│   │   └── utils.ts                 # 无业务小工具
│   ├── styles/                      # StudySolo 令牌（tokens.css）+ base.css
│   └── server/                      # 仅开发期可用；桌面包无动态 Route Handler
├── electron/                        # 打包阶段再建：main / preload（与 src 隔离）
├── docs/                            # 见 docs/README.md（含 adr/ lessons/）
├── scripts/                         # setup / build / deploy / dev
├── public/                          # 静态资源（不放 >25MB）
├── AGENTS.md
├── next.config.ts                   # 必须保持 output:'export' 三件套
└── package.json
```

**明确不存在、禁止再引入：**

- `src/app/api/`、任何 `route.ts` Route Handler、Server Actions
- `pages/`、`middleware.ts`、`edgeone.json`
- `(marketing)` / `(app)` 登录分流路由组（P0 无账号体系）

## 分层规则

- `src/app/` 只放路由入口，业务逻辑下沉到 `src/features/`
- `src/components/ui/` 只放无业务纯 UI；领域库封装放 `src/components/<domain>/` 或 `src/lib/{ai,db,providers}/`（以 libraries.md 为准）
- 第三方领域库禁止业务代码直接 import 包名，一律走封装层
- `src/features/` 之间禁止横向 import；渲染模块只依赖 `render-modules/types.ts`、`src/lib`、`src/components/ui`
- 系统能力（麦克风、通知、落盘、电源）走 Electron main + IPC，不走 Next 服务端
- `src/app/_dev/` 单向引用：可引用正式代码，正式代码不得引用 `_dev/`
- 静态路径必须先出现在 [routing.md](./routing.md)；共享动效/预设只进 Playbook

## 文件放置决策

详见 [code-size-and-organization.md](./code-size-and-organization.md) 的"文件放置决策树"和 `src/features/` 提升条件。
