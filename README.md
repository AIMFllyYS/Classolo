# Classolo

> AI 课堂工作台 —— 实时录音转文字、AI 思维导图笔记与生成式组件渲染的一站式上课赋能平台。

## 项目简介

Classolo 是 1037Solo 生态中的课堂赋能子项目，定位为「一站式上课赋能平台，串联笔记、复习与本质思考」。它以**本地优先（local-first）**的桌面工作台形态运行：课堂上实时录音转文字、AI 实时整理思维导图笔记、静默 Agent 按需渲染图片与生成式 UI 组件；课后自动沉淀知识清单、驱动遗忘曲线复习、自动出题与期中期末押题。

P0–P2 全程本地运行（自配 API 密钥 + 本地存储，经 Electron 打包为桌面 exe），通过可插拔 Provider 架构在最晚阶段平滑迁移至 1037Solo 生态（统一登录 / Supabase / 邮件推送 / 宝塔自部署 Web 版）。

### 核心能力

- **文稿区 — 实时录音转文字**：通用 ASR 接入层（6 协议族适配器），默认阶跃/百炼真流式（~1.2 元/小时），支持任意自定义端点 + 密钥，离线 sherpa-onnx 兜底
- **笔记区 — AI 实时思维导图**：AI 增量整理转写流，@xyflow/react 增量 diff 渲染（已有节点不闪烁），参考飞书妙记形态
- **渲染区 — 协议化自定义组件**：静默 Agent「工具调用即渲染」——图片检索 / 富文本补充 / AI 提问 / 生成式 UI（受控 DSL），模块间零耦合
- **课堂 Agent**：Vercel AI SDK 驱动，完整对话 + 思考过程流式展示 + 工具检索真实文稿
- **录音会话保存与资源库**（P1）· **复习站**（P1，遗忘曲线）· **测试站**（P1/P2，自动出题/错题加固/押题卷）

## 技术栈（全部选型经联网调研 + ADR 记录）

| 关注点 | 所有者 | 依据 |
|---|---|---|
| 框架 | Next.js ≥16.2（App Router）+ React 19 + TS strict | ADR-0001 |
| UI / 设计体系 | shadcn/ui + Tailwind v4 + StudySolo 生态令牌（日夜双主题） | ADR-0003 |
| ASR | 自研协议族适配器（realtime-ws / REST / local） | ADR-0004 |
| 思维导图 | @xyflow/react + @dagrejs/dagre | ADR-0005 |
| Agent 框架 | Vercel AI SDK（`ai` + `@ai-sdk/openai-compatible`） | ADR-0006 |
| 本地数据 | PGlite（内嵌 Postgres）+ Drizzle ORM | ADR-0007 |
| 分屏布局 | react-resizable-panels（经 shadcn Resizable） | ADR-0008 |
| 桌面端 | Electron 静态导出 + `app://` + electron-builder NSIS | ADR-0009 |
| 渲染协议 | 自研 CRP（Classolo Render Protocol） | ADR-0010 |

完整决策链：`docs/adr/`；选型对比现场：`docs/designs/library-showcase/*.html`（双击即看）。

## 快速开始

要求：Node.js ≥22.12、pnpm。

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:4070](http://localhost:4070)（4070 为 1037Solo 生态预留端口）。构建：`pnpm build`（产物在 `out/`）。

## 项目结构

```
.
├── src/
│   ├── app/                    # 路由层
│   ├── components/             # 纯 UI 组件 + 第三方库封装层
│   ├── features/               # 业务模块（transcript/notes/render-modules/agent/…）
│   ├── lib/                    # providers/（可插拔接口）、ai/、db/、工具
│   ├── styles/                 # StudySolo 设计令牌
│   └── server/                 # server-only 代码
├── docs/
│   ├── adr/                    # 架构决策记录（只增不改）
│   ├── lessons/                # 踩坑经验库（一库一文件）
│   ├── libraries.md            # 组件库注册表（关注点→唯一所有者）
│   ├── skills-registry.md      # skills 绑定表
│   ├── designs/                # 架构设计 + library-showcase 选型对比页
│   ├── plans/ conventions/ specs/ ops/ updates/ audits/ issues/
├── scripts/                    # setup/build/deploy/dev 辅助脚本
├── AGENTS.md                   # AI 编码代理操作索引（仓库即记忆）
└── next.config.ts              # output: 'export'（Electron 桌面包依赖）
```

## AI 协作说明

本项目由多 AI Agent 交替开发，启用完整自进化机制：任何 Agent 以 [AGENTS.md](./AGENTS.md) 为入口，按触发条件读取 `docs/` 下文档。踩坑记录进 `docs/lessons/`，决策记录进 `docs/adr/`，依赖引入以 `docs/libraries.md` 为唯一裁判。

## License

MIT
