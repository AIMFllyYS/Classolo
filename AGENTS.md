# AGENTS.md — Classolo

> AI 课堂工作台 —— 实时录音转文字、AI 思维导图笔记与生成式组件渲染的一站式上课赋能平台（1037Solo 生态子项目）。
> 本文件是 AI 编码代理的**操作索引**——只放最高频命令与不可省略的硬规则。
> 详细规范按需查阅，见末尾 [Documentation Index](#documentation-index) 的路径 + 触发条件。
> 本项目不依赖任何 Agent/IDE 的内置记忆：仓库即记忆。Agent 私有记忆与本仓库文档冲突时，以仓库文档为准。

## Tech Stack

- **Framework**: Next.js ≥16.2.0 (App Router only, no Pages Router)
- **React**: ≥19.2 | **TypeScript**: strict mode | **Package Manager**: pnpm
- **Node**: ≥22.12（Electron 44 要求，勿降回 22.11）| **Styling**: Tailwind CSS v4 + shadcn/ui + StudySolo 设计令牌
- **数据**: PGlite（内嵌 Postgres）+ Drizzle ORM | **AI**: Vercel AI SDK（唯一 Agent 框架所有者）
- **桌面端**: Electron（静态导出 + `app://` 特权协议 + electron-builder NSIS），本地优先，无云部署

## Key Commands

- Install: `pnpm install` | Dev: `pnpm dev`（端口固定 4070，生态预留）| Build: `pnpm build` | Start: `pnpm start`
- Typecheck: `pnpm tsc --noEmit` | Lint: `pnpm lint` | Lint fix: `pnpm lint --fix`

## Shell Environment

> 本地开发环境是 **Windows + PowerShell**，不是 bash/zsh。

- **不要用 `&&` 串联命令** — 用 `;` 分隔，或 `cmd1; if ($?) { cmd2 }` 做条件执行
- **不要用 bash heredoc (`<<'EOF'`)** — 多行 commit message 用 `git commit -F <file>` 配合临时文件
- **shell 条件判断用 `-and`/`-or`/`-not` 或 `if ($?)`**，不是 `&&`/`||`/`!`
- 含空格的路径必须用双引号包裹

## Definition of Done

1. 变更文件已 staged | 2. Commit 遵循 Conventional Commits：`type(scope): description`
3. `pnpm lint` exits 0 | `pnpm tsc --noEmit` exits 0 | `pnpm build` exits 0

## 依赖纪律

- **AI 无权单独新增/删除生产依赖。** 必须先列候选、说明现有栈为何不够、给出体积与许可证，等确认。
- **安装前核实包名真实存在于 registry**（防幻觉包）。禁止凭记忆陈述库的 API 与版本。
- **每个关注点只有一个所有者**——查 [docs/libraries.md](docs/libraries.md)，注册表之外的同类库禁止引入。
- **`package.json` 的 diff 按最高风险等级 review。**
- 第三方领域库一律经由封装层调用（入口见 libraries.md 的"封装层入口"列），业务代码禁止直接 import 库包名。

## When Blocked

- 构建连续失败 3 次 → 停下报告完整错误输出
- 依赖缺失 → 先查 `package.json` 与 `docs/libraries.md`，再问
- 合并冲突 → 停下展示冲突文件
- **Never**: 删除 lock 文件、force push、跳过测试、绕过 lint

## Project Structure

```
src/app/         路由层（只放路由文件，业务逻辑下沉到 src/features/）
src/components/  纯 UI 组件 + 第三方库封装层（<domain>/ 子目录是对应库的唯一入口）
src/features/    业务领域模块（transcript/ notes/ render-modules/ agent/ review/ quiz/ settings/）
src/lib/         工具函数、通用 hooks、providers/（可插拔 Provider 接口）、ai/、db/
src/server/      server-only 代码
src/styles/      设计令牌与全局样式（StudySolo 体系）
```

> 完整目录规则与文件放置决策见 [docs/conventions/](docs/conventions/)。

## Critical Rules（省略了就会犯错）

- **`proxy.ts` not `middleware.ts`** — 后者已废弃（详见 [nextjs-16-patterns.md](docs/conventions/nextjs-16-patterns.md)）
- **`params`/`searchParams`/`cookies()`/`headers()` 必须 `await`** — Next.js 16 强制异步
- **默认 Server Component，`'use client'` 放叶子组件** — 不放页面级
- **`_dev/` 单向引用 + production 守卫** — 每页顶部 `if (process.env.NODE_ENV === 'production') notFound()`；正式代码不得引用 `_dev/`
- **TypeScript strict，禁止 `any`** — 用 `unknown` + 类型收窄
- **禁止使用 `middleware.ts` / Pages Router（`pages/` 目录）**
- **`next.config.ts` 保持 `output: 'export'` 三件套** — Electron 桌面包依赖静态导出；**禁止新增动态 Route Handler / Server Action**，系统能力走 Electron main + IPC
- **Dev 端口固定 4070** — 1037Solo 生态为 Classolo 预留，不要改
- **本地优先 + 可插拔红线** — Auth/Storage/Mail/AI/ASR 一律走 `src/lib/providers/` 接口，业务代码禁止绕过接口直连具体实现；P0 不接生态数据库/邮件/登录
- **渲染模块互不耦合** — `src/features/render-modules/` 各模块禁止横向 import，只依赖协议 types（详见 [render-module-protocol.md](docs/designs/render-module-protocol.md)）
- **色系只用 StudySolo 令牌** — `src/styles/tokens.css` 的语义变量（`--primary` 等），禁止硬编码品牌色、禁止另起色板
- **禁止一切腾讯云 EdgeOne 相关配置** — 本项目不用 EdgeOne；生态 Web 版走宝塔自部署（很晚才做）

## 自进化机制（常驻规则）

- **踩坑必录**：凡"AI 因对某库/平台的错误认知出错、后被修正"，修正后必须向 `docs/lessons/<lib>.md` 申请追加记录（格式见 [docs/lessons/README.md](docs/lessons/README.md)）。
- **批量结算**：lessons / 规范 / ADR 的修改先落为未提交 diff，会话收尾一次性汇报待确认，**未经用户确认不得 commit**。
- **架构/选型决策**发生时写 ADR（`docs/adr/`，只增不改，推翻用 Superseded 标注）。

## Git Workflow

- 从 `main` 切出，前缀 `feat/`、`fix/`、`chore/`；squash merge；PR 过 CI + 至少一次审查

### Issue 与 PR 协作（强制查表）

> 创建 issue、拆 issue、处理 issue 驱动开发、创建 PR 前，**必须先查 [docs/skills-registry.md](docs/skills-registry.md) 并调用对应 skill**；issue/PR 正文注明引用了哪些 skill。跳过查表直接操作会破坏协作一致性。

## Boundaries

### ✅ Allowed without asking
- 读取文件、列出目录；运行 lint / typecheck / 单文件测试
- 修改 `src/` 下业务代码与 UI 组件；在 `src/app/_dev/` 下创建调试页面

### ⚠️ Ask first
- 安装/删除依赖；删除文件；修改任何根级配置文件；Push / 创建 PR
- 向 docs/lessons、docs/adr、规范文档写入内容（走批量结算）

### 🚫 Never
- 提交 `.env*` / 密钥凭据（用户 API key 只存本地）；force push 到受保护分支
- 修改构建产物目录与 lock 文件（lock 只经包管理器间接变更）
- 在 `next.config.ts` 中启用 EdgeOne / Vercel 等云部署专属配置

## Documentation Index

> 路径 + 触发条件。满足触发条件时**必须先读**对应文档再动手；不满足不要读（渐进式披露）。

| 触发条件 | 必读文档 |
|---|---|
| 引入/变更任何依赖前 | [docs/libraries.md](docs/libraries.md) |
| 使用某第三方库写代码前 | `docs/lessons/<该库>.md`（存在则读） |
| 创建 issue / PR 前 | [docs/skills-registry.md](docs/skills-registry.md) |
| 疑惑"当初为什么这么选"时 | `docs/adr/` 对应编号（0001 为项目范围） |
| 动布局/分区/Provider/迁移相关设计前 | [docs/designs/architecture-overview.md](docs/designs/architecture-overview.md) |
| 新增/修改渲染区模块前 | [docs/designs/render-module-protocol.md](docs/designs/render-module-protocol.md) |
| 做 ASR 接入/适配器前 | [docs/adr/0004-asr-universal-access.md](docs/adr/0004-asr-universal-access.md) + `docs/designs/library-showcase/asr.html` |
| 规划迭代/确认功能范围时 | [docs/plans/roadmap-p0-p1-p2.md](docs/plans/roadmap-p0-p1-p2.md) |
| 设计题目/复习数据结构前 | [docs/specs/question-schema.md](docs/specs/question-schema.md) |
| 写长文件/纠结文件放哪时 | [docs/conventions/code-size-and-organization.md](docs/conventions/code-size-and-organization.md) |
| Code review 时 | [docs/conventions/code-review.md](docs/conventions/code-review.md) |
| 写 Next.js 路由/组件遇到框架行为疑问时 | [docs/conventions/nextjs-16-patterns.md](docs/conventions/nextjs-16-patterns.md) |
