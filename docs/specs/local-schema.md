# 本地数据 Schema 规格（P0 最小集 + P1/P2 预留）

> Created: 2026-08-30
> Updated: 2026-08-30
> Status: approved
> 决策依据：[ADR-0016](../adr/0016-local-schema.md)（本规格的决策记录）、[ADR-0007](../adr/0007-local-database.md)（PGlite + Drizzle）、[ADR-0001](../adr/0001-project-scope.md)（本地优先范围）

## 本规格是软约束

**日常实现必须按本规格走**：建表、加列、起名、选类型、决定"落不落库"，一律以本文为准，不得在 `src/lib/db/` 里静默另起一套表。

同时本规格**允许被修订**：实现过程中若发现实体或字段不够用（例如某个 P0 功能确实需要一张这里没有的表），流程是——

1. **深度分析**：先确认现有表 + JSONB 列真的表达不了，而不是图省事；
2. **改本文**：把新增/变更写进本规格对应小节，并在文末「修订记录」追加一行；
3. **必要时补 ADR**：若变更动摇了本文的核心取舍（表前缀、类型口径、"什么不入库"、批量写策略），新写一篇 ADR 并在此处引用；
4. **批量结算**：spec / ADR 的改动先落为未提交 diff，会话收尾一次性汇报，未经用户确认不得 commit。

**禁止**：绕过本文直接在代码里新增表或列；用"临时表"名义引入长期结构；为一次性需求给核心表加列（先考虑 JSONB 或 `cs_setting`）。

## 背景

P0 是纯本地、无账号、单机匿名用户的课堂工作台。数据层是 PGlite（内嵌 Postgres，WASM）+ Drizzle `pg-core`，开发期跑浏览器 IndexedDB + `relaxedDurability`，Electron 期移到 main process 的 `userData` 文件库（ADR-0007）。最晚阶段整体迁移到 1037Solo 生态的共享 Supabase，硬要求是 **schema / SQL 零重写**。

这带来两条互相拉扯的约束：

- **要少**：P0 的表越少，压测面、迁移面、心智负担越小；
- **要对**：45–90 分钟课堂产生高频转写写入，且课后要能按时间轴回看、给 Agent 检索。把一节课塞进一个巨型 JSON 行是最省事的写法，也是最错的写法。

本规格在这两者之间给出定案。

## 目标

1. 定义 P0 必须落地的最小表集合，每张表都能对应到一个 P0 功能，砍掉任何一张都会缺功能；
2. 明确划出**不入库**的边界（音频、密钥、布局、像素坐标、流式中间态）；
3. 给出转写流的批量落库策略（主键、分段、flush 触发、幂等、失败降级），使 ADR-0007 承诺的压测有明确口径；
4. 为 P1/P2 预留表名与语义，但**不提前建表、不提前设计字段**；
5. 保证迁移 Supabase 时改动面收敛为「连接驱动 + `user_id` 回填 + RLS 策略」三件事。

---

## 一、全局口径（所有表通用）

### 1.1 命名与前缀

- 表名一律 **`cs_` 前缀**（Classolo），小写 snake_case，**单数名词**（`cs_session` 而非 `cs_sessions`）。
  - 前缀是 Supabase 共享库的命名空间保险（生态约定：`ss_` StudySolo / `pt_` Platform / `fm_` Forum / `cs_` Classolo）。**P0 就带前缀**，迁移时表名零改动。
- 索引名 `idx_<表名去 cs_ 前缀>_<语义>`，唯一约束名 `uq_<表名去前缀>_<语义>`。
- 列名 snake_case；Drizzle 侧属性名 camelCase，映射在 schema 文件里完成，业务代码只见 camelCase。

### 1.2 类型口径（对齐 Supabase，禁止 SQLite 化）

| 用途 | 类型 | 说明 |
|---|---|---|
| 主键 / 外键 | `uuid` | **应用层生成**（`crypto.randomUUID()`），不依赖 `gen_random_uuid()` 默认值 |
| 绝对时间 | `timestamptz` | 一律带时区。业务代码传 `Date`，禁止传 epoch number |
| 会话内相对时间 | `integer`（毫秒） | ASR 给的就是相对偏移；相对 `cs_session.started_at` |
| 结构化嵌套数据 | `jsonb` | 不是 `json`、不是 `text`。形状由 zod schema 在 Repository 边界校验 |
| 枚举语义列 | `text` + CHECK | **禁止 pg enum**：加值要 `ALTER TYPE`，迁移期成本高、Drizzle diff 噪音大 |
| 计数 / 序号 | `integer` | 会话内序号由应用层单调分配，不用 DB sequence |
| 布尔 | `boolean` | 禁止用 `0/1` |

**为什么主键在应用层生成**：① 批量 INSERT 前就需要知道 id（CRP `transcriptAnchor`、内存 ring buffer 里的引用都要在落库前成立）；② 规避 PGlite 里 `pgcrypto` / `gen_random_uuid()` 可用性的未核实项（见「未核实项」一节）；③ 幂等重试时 id 稳定，`ON CONFLICT DO NOTHING` 才有意义。

> `crypto.randomUUID()` 要求 secure context。`localhost:4070` 满足；Electron 的 `app://` 特权协议注册时必须标记为 secure（ADR-0009 的注册参数），**这一点在 Electron 打包阶段必须实测确认**。

### 1.3 多租户预留（迁移的核心保险）

**每张业务表都带 `user_id uuid NOT NULL`**，P0 恒为匿名常量：

```
ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000001'
```

- P0 **不建 `cs_user` 表**（没有账号，没有可存的东西）。常量定义在 `src/lib/db/constants.ts`，同时写一份进 `cs_setting`（key: `app.anonymousUserId`）供迁移脚本读取。
- 迁移 Supabase 时：`UPDATE cs_* SET user_id = <真实 auth.users.id> WHERE user_id = '000...001'`，然后开 RLS `USING (user_id = auth.uid())`。**业务查询代码不变**——因为 Repository 层从第一天起就在 `WHERE user_id = ?` 上过滤（P0 传常量）。
- 这一列的成本是 16 字节 × 行数（一节课 ~1500 行 = 24KB），换的是迁移期零重构。**不要为了"P0 用不上"把它省掉。**

### 1.4 删除与迁移

- **硬删除 + `ON DELETE CASCADE`**：删一次课堂会话就连带删掉它的转写段、大纲、渲染消息、对话消息。P0 不做软删除（没有多设备同步，没有"回收站"需求）。
- Schema 迁移用 **drizzle-kit 生成 SQL migration**，产物随包分发，应用启动时按序执行（Electron 期在 main process 执行，renderer 拿到的一定是已迁移的库）。**不手写 DDL、不在运行时 `CREATE TABLE IF NOT EXISTS`。**
- 迁移版本表由 drizzle 自己维护；不要自建版本表。（PGlite 下 drizzle migrator 的具体调用形式属「未核实项」，落地时查当版文档，不要凭记忆写。）

---

## 二、P0 表清单（7 张）

一览：

| 表 | 用途 | 行数量级（每课） | 写入频率 |
|---|---|---|---|
| `cs_session` | 课堂会话头 | 1 | 极低（~5 次/课） |
| `cs_transcript_segment` | 转写段（时间轴真源） | 500–1500 | 中（批量，~90 次/课） |
| `cs_note_outline` | 思维导图大纲树（1:1 会话） | 1 | 中（节流 UPSERT，~180 次/课） |
| `cs_render_message` | CRP 渲染消息快照 | 20–80 | 极低（收尾批量 1–3 次） |
| `cs_chat_message` | 课堂 Agent 对话消息 | 0–40 | 低（每轮对话 2 行） |
| `cs_provider_profile` | AI / ASR 端点档案（**不含密钥**） | — | 仅设置页操作时 |
| `cs_setting` | 单例偏好 KV | — | 极低 |

> 这 7 张不是"起步集合"，是"完整集合"：P0 的六个功能（工作台、实时转写、思维导图笔记、CRP 渲染、课堂 Agent、设置）没有任何一个需要第 8 张表。新增表前请回到本文档「本规格是软约束」一节走流程。

### 2.1 `cs_session` — 课堂会话头

**用途**：一次录音 = 一条。是所有会话内数据的父行与级联删除的锚点，也是 P1 左侧导航栏历史列表的数据源。

**关键列**

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | `uuid` PK | 应用层生成 |
| `user_id` | `uuid` NOT NULL | P0 匿名常量 |
| `title` | `text` NOT NULL | 默认「YYYY-MM-DD HH:mm 课堂」，AI 可在结束时改写为主题标题 |
| `status` | `text` NOT NULL | `recording` \| `paused` \| `ended` \| `interrupted` |
| `started_at` | `timestamptz` NOT NULL | 所有 `*_ms` 相对时间的零点 |
| `ended_at` | `timestamptz` NULL | |
| `duration_ms` | `integer` NOT NULL default 0 | 净录音时长（扣除暂停） |
| `asr_snapshot` | `jsonb` NOT NULL | 本次用的 ASR 配置快照：`{family, dialect, model, baseUrl, sampleRate, hotwordPack}`。**绝不含 apiKey** |
| `stats` | `jsonb` NOT NULL default `{}` | `{segmentCount, charCount, renderMessageCount, chatTurnCount}`，结束时一次性写 |
| `created_at` / `updated_at` | `timestamptz` NOT NULL | |

**索引**：`idx_session_user_started (user_id, started_at DESC)` —— 导航栏历史列表的唯一查询形态。

**写入频率**：开始录音 INSERT 1 次；暂停/恢复 UPDATE；结束时 UPDATE（status + ended_at + duration + stats + 可能的 AI 标题）。**上课过程中不要每秒更新 `duration_ms`**——时长在内存计，结束时落一次。

**谁读写**：写 = `features/transcript`（录音控制条）经 `SessionRepository`；读 = 工作台首屏、P1 `features/library`。

**崩溃恢复**：应用启动时扫描 `status = 'recording'` 的行，改判为 `interrupted`，并用该会话已落库转写段的最大 `end_ms` 回填 `duration_ms`。

**为什么 `asr_snapshot` 是快照而不是外键指向 `cs_provider_profile`**：用户会改配置、会删 profile，历史会话必须保留"当时用的是什么"。指向 profile 的外键会在删 profile 时炸掉历史，或强迫做软删除。快照更便宜也更诚实。

### 2.2 `cs_transcript_segment` — 转写段（时间轴真源）

**用途**：文稿区正文的持久化形态。P0 的时间轴回看、点击导图节点回跳文稿、Agent 检索真实讲课内容，全部落在这张表上。**这是本规格里唯一一张被明确要求"不许折叠成一个大 JSON"的表。**

**关键列**

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | `uuid` PK | 应用层生成；**即 CRP 的 `meta.transcriptAnchor` 取值** |
| `session_id` | `uuid` NOT NULL FK → `cs_session(id)` ON DELETE CASCADE | |
| `user_id` | `uuid` NOT NULL | |
| `seq` | `integer` NOT NULL | 会话内单调序号，应用层分配（从 0 起） |
| `start_ms` | `integer` NOT NULL | 相对 `session.started_at` |
| `end_ms` | `integer` NOT NULL | |
| `text` | `text` NOT NULL | 已定稿文本（**只存 final**） |
| `block_id` | `uuid` NULL | 语义段 id：静默 Agent 的节流触发单元。允许为空（P0 可后接） |
| `asr_meta` | `jsonb` NULL | `{dialect, confidence?, hotwordHits?, revisedFrom?}` 等诊断信息，可空 |
| `created_at` | `timestamptz` NOT NULL | 落库时刻（≠ 说话时刻） |

**索引**

- `uq_transcript_segment_session_seq (session_id, seq)` UNIQUE —— **批量重试幂等的依据**（`ON CONFLICT DO NOTHING`）
- `idx_transcript_segment_session_time (session_id, start_ms)` —— 时间轴范围查询、回看定位
- `idx_transcript_segment_block (session_id, block_id)` WHERE `block_id IS NOT NULL` —— Agent 按语义段取全文

**主键取舍（明确记录）**：候选是「复合主键 `(session_id, seq)`，anchor 用 `"<sessionId>:<seq>"` 字符串」，能省一个 uuid 列 + 一个索引。**否决**，理由是 CRP 协议里 `transcriptAnchor?: string` 若承载复合键，渲染模块与 Agent 工具两端都要做拼装/解析，是把存储细节漏进协议层——违反渲染模块只依赖 `types.ts` 的红线。用独立 uuid 主键，`(session_id, seq)` 降为唯一约束，多付一个索引换协议干净。

**写入频率**：见「三、转写批量落库策略」。目标 **~90 次批量 INSERT / 90 分钟课**，每次 10–20 行。

**谁读写**：写 = `features/transcript` 的 flusher（唯一写入者，**不允许其他模块往这张表写**）；读 = 文稿区渲染、`features/notes`（喂给笔记整理器）、`features/agent` 的检索工具、P1 `features/review`。

**Agent 检索的 P0 口径**：一节课 500–1500 行，`ILIKE '%关键词%'` 的全表扫描在这个量级下毫秒级，**P0 就用它**。明确不做：中文 tsvector（PGlite 无中文分词扩展）、向量嵌入检索（pgvector 在 PGlite 的可用性属未核实项，且 P0 没有跨会话检索需求）。P1 做「新对话检索历史课堂」时再评估，届时需要 ADR。

### 2.3 `cs_note_outline` — 思维导图大纲树

**用途**：笔记区的持久化真源。存的是**大纲树 JSON**，不是 xyflow 的图。

**关键列**

| 列 | 类型 | 说明 |
|---|---|---|
| `session_id` | `uuid` PK, FK → `cs_session(id)` ON DELETE CASCADE | **1:1，直接拿 session_id 当主键**，不另起 id |
| `user_id` | `uuid` NOT NULL | |
| `outline` | `jsonb` NOT NULL | 大纲树（形状见下） |
| `revision` | `integer` NOT NULL default 0 | 每次 UPSERT +1，用于丢弃乱序到达的旧快照 |
| `updated_at` | `timestamptz` NOT NULL | |

**索引**：主键即够。不需要额外索引。

**大纲节点形状（稳定 id 是硬要求，ADR-0005）**

```ts
interface OutlineNode {
  id: string            // 稳定 id：一旦生成不随内容改写而变（增量 diff 的身份依据）
  text: string          // 节点文本（markdown inline）
  children: OutlineNode[]
  anchor?: {            // 点节点回跳文稿
    segmentId: string   // → cs_transcript_segment.id
    startMs: number
  }
}
// outline 列存 { root: OutlineNode; generatedAt: string }
```

**明确不存**：xyflow 的 `position: {x, y}`、节点尺寸、视口 transform、折叠状态。坐标是 dagre 每帧算出来的**派生物**，把它当真源会导致「换布局算法 = 数据迁移」。用户手动拖动过的节点若日后要保留，方案是在 `OutlineNode` 上加 `layoutHint?: {x, y}`（P1 议题，`reserved`），而不是新建坐标表。

**写入频率**：AI 每几秒产出一版大纲，但**不是每版都落库**。落库策略：

- 节流 **30 秒**一次 UPSERT，且**大纲结构哈希未变则跳过**；
- 暂停 / 结束录音时强制落一次；
- 页面 `visibilitychange → hidden` 与 `beforeunload` 时强制落一次。

→ 90 分钟课约 **≤180 次** UPSERT。这是整张表唯一的写压力来源。

**为什么不合并进 `cs_session` 的一个 jsonb 列**（1:1 本可以合并，"宁少勿多"原则下这是最该被质疑的一张表）：`cs_session` 是小而热的行（状态机频繁 UPDATE），`outline` 是会进 TOAST 的大 JSONB。合并后每次改会话状态都要重写整个大纲的行版本，反之亦然，MVCC 死元组翻倍。**分表是为了把大字段和热字段隔离**，代价是一张表，值得。

### 2.4 `cs_render_message` — CRP 渲染消息快照

**落库策略的明确建议：上课中纯内存，会话收尾批量快照。不逐条落库。**

理由：

- 渲染消息是**上课时的即时产物**，其价值 90% 在当下（看到图、看到补充讲解）。逐条落库会把 Agent 的每次工具调用变成一次数据库写，和"转写禁止逐句写库"是同一个错误；
- 但它不是零价值：P1 的「录音会话保存 / 回看历史课堂」要求完整还原当时的渲染区，否则历史会话只剩光秃秃的文稿；
- 所以：内存 store（zustand）是运行期真源，**在暂停 / 结束 / 页面卸载时**把当前消息数组一次性批量 INSERT。一次课一到三次写，代价可忽略。

**为什么一条一行、不是一个 JSON 数组塞进 `cs_session`**：① P1 需要按 `module` 过滤（"只看这节课的图片"）、按 anchor join 回文稿；② 单条消息可被更新/撤回（CRP `id` 的语义），数组做不到原子更新；③ 巨型 JSON 行同样是本规格反对的形态。

**关键列**（与 `src/features/render-modules/types.ts` 的 `RenderMessage` 一一对应）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | `uuid` PK | **直接用 `RenderMessage.id`**，不另生成 |
| `session_id` | `uuid` NOT NULL FK CASCADE | |
| `user_id` | `uuid` NOT NULL | |
| `module` | `text` NOT NULL | `image` \| `rich-text` \| `ai-ask` \| `gen-ui` \| `agent-status` |
| `version` | `text` NOT NULL | 模块协议版本，如 `1.0`。**读取时必须按此列做兼容解析** |
| `target` | `text` NOT NULL | `transcript` \| `notes` |
| `props` | `jsonb` NOT NULL | 模块自定义 props，读回时过 manifest 的 zod schema，失败渲染兜底错误卡片 |
| `source` | `text` NOT NULL | `silent-agent` \| `chat-agent` \| `system` |
| `transcript_anchor` | `uuid` NULL FK → `cs_transcript_segment(id)` ON DELETE SET NULL | |
| `created_at` | `timestamptz` NOT NULL | 由 `meta.createdAt`（epoch ms）转换而来 |

**索引**：`idx_render_message_session_time (session_id, created_at)`。P0 只有这一种查询（按会话时间序重放）。**不要**预先给 `module` 建索引——一节课几十行，过滤在应用层做。

**协议边界注意**：`RenderMessage.meta.createdAt` 是 `number`（epoch ms），库里是 `timestamptz`。转换**只发生在 `RenderMessageRepository` 内部**，协议类型不改、渲染模块无感。

**谁读写**：写 = 渲染总线的 flusher；读 = P1 会话回看。**渲染模块自身不许碰数据库**（模块只能 import `types.ts` / `src/lib` / `src/components/ui`，而 Repository 属于 `src/lib/db`——即便路径合法，也不要在模块里查库，会破坏模块可移植性）。

### 2.5 `cs_chat_message` — 课堂 Agent 对话消息

**用途**：可对话 Agent 的往返记录。刷新页面、崩溃重启后对话仍在。

**关键列**

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` NOT NULL FK CASCADE | P0 对话恒属于某节课 |
| `user_id` | `uuid` NOT NULL | |
| `seq` | `integer` NOT NULL | 会话内单调序号 |
| `role` | `text` NOT NULL | `user` \| `assistant` \| `system` \| `tool` |
| `content` | `text` NOT NULL | 最终文本（markdown） |
| `parts` | `jsonb` NULL | AI SDK 的结构化 parts：reasoning、tool-call/tool-result 摘要。**只存最终态** |
| `created_at` | `timestamptz` NOT NULL | |

**索引**：`uq_chat_message_session_seq (session_id, seq)` UNIQUE（同时服务于顺序读取与幂等）。

**写入频率**：**只在一轮对话完成时写**——用户消息发出时写 1 行，助手消息 `onFinish` 时写 1 行。**流式 token、reasoning delta 一律不落库**（每秒几十次写，绝对禁止）。

**为什么不和 `cs_render_message` 合并成一张 `cs_session_event`**（判别列 + payload jsonb，能省一张表）：**否决**。① 两者列集只有 `id/session_id/created_at` 重合，合并后一半列恒 NULL，CHECK 约束要写成"当 kind='render' 时 module 非空"这种条件约束地狱；② 生命周期不同——CRP 消息可更新/撤回，chat 消息 append-only；③ 合并会诱导跨域查询（一条 SQL 同时捞渲染和对话），把「渲染模块与 Agent 解耦」的架构红线在存储层重新焊死。省一张表不值这个价。

**P1 演进点（现在就写明，避免届时乱改）**：P1 的「新对话」是脱离课堂的独立对话。届时新增 `cs_conversation` 表，本表 `session_id` 放宽为 NULL + 新增 `conversation_id uuid NULL`，加 CHECK「二者恰有其一非空」。**P0 不提前做**。

### 2.6 `cs_provider_profile` — AI / ASR 端点档案（不含密钥）

**用途**：用户手持多家低价 key（阶跃/百炼/Groq/硅基…），需要保存多套端点配置并切换。这张表存**除密钥以外的一切**。

**密钥红线（本规格最重要的一条）**

> **API key 永不进入本表、永不进入任何业务表、永不进入 jsonb 列。**

密钥走更高优先级的凭据存储：

- **Electron 期**：main process 的 `safeStorage`（OS 级加密），renderer 经 IPC 只能"用"不能"读"——即由 main 代持并注入请求，或按需解密后立即使用不落盘；
- **开发期（浏览器）**：无等价能力。使用 `sessionStorage` 或内存态，并在设置页**明确提示"开发模式下密钥不加密"**。**禁止**为了方便把开发期密钥写进 PGlite；
- **`.env` 是开发默认值**（`.env.example` 已列 `AI_API_KEY` / `ASR_API_KEY`），只在开发期做兜底，**不入库**，且设置页配置优先级高于 `.env`。

表里只留一个**引用 + 布尔**：`credential_ref`（凭据存储里的句柄键名）与 `has_credential`。UI 显示"已配置 ✓"靠后者，而不是靠读出密钥判空。

**关键列**

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` NOT NULL | |
| `kind` | `text` NOT NULL | `ai` \| `asr` \| `image-search` |
| `label` | `text` NOT NULL | 用户可读名，如「阶跃 ASR」 |
| `family` | `text` NULL | ASR 协议族（`realtime-ws` / `transcriptions-rest` / `local-engine` …，见 `ASRFamily`）；`kind='ai'` 时为空 |
| `dialect` | `text` NULL | `stepfun` \| `qwen` \| … |
| `base_url` | `text` NOT NULL | **校验：禁止 query string 携带密钥**，落库前剥离 `?`/`#` 之后的内容 |
| `model` | `text` NOT NULL | |
| `sample_rate` | `integer` NULL | ASR 用，默认 16000 |
| `options` | `jsonb` NOT NULL default `{}` | 非密钥偏好：`{hotwordPack, timeoutMs, temperature, maxTokens, headers?}`。**`headers` 内禁止出现 Authorization** |
| `credential_ref` | `text` NULL | 凭据存储的句柄键名（如 `classolo.cred.<profileId>`），**不是密钥本身** |
| `has_credential` | `boolean` NOT NULL default false | UI 的"是否已配置"唯一依据 |
| `is_default` | `boolean` NOT NULL default false | 同 `kind` 下唯一 |
| `created_at` / `updated_at` | `timestamptz` NOT NULL | |

**索引**：`idx_provider_profile_user_kind (user_id, kind)`；`uq_provider_profile_default (user_id, kind) WHERE is_default` UNIQUE（部分唯一索引，保证每类只有一个默认）。

**写入频率**：仅设置页增删改时。

**谁读写**：`features/settings` 写；`src/lib/providers/asr/`、`src/lib/ai/` 的工厂读（读到 profile 后，再向凭据存储换取密钥——**换取动作在 Provider 工厂内部，业务代码永不接触密钥字符串**）。

### 2.7 `cs_setting` — 单例偏好 KV

**用途**：所有"全局只有一份"的偏好。用 KV 而不是宽表，是为了**避免每加一个开关就 ALTER TABLE**。

**关键列**：`key text PK` / `user_id uuid NOT NULL` / `value jsonb NOT NULL` / `updated_at timestamptz NOT NULL`。
（`key` 与 `user_id` 的联合唯一在 P0 等价于 `key` 唯一；迁移 Supabase 时主键改为 `(user_id, key)`——**这是本规格里唯一一处迁移会改主键的地方**，已列入迁移清单。）

**索引**：主键即够。

**P0 键位约定**（键名用点分命名空间，禁止随手起名）

| key | value 形状 | 说明 |
|---|---|---|
| `app.anonymousUserId` | `string` | 匿名用户常量，迁移脚本读取 |
| `ai.defaultProfileId` | `string \| null` | 冗余于 `is_default`，仅作快速读取，可省 |
| `asr.hotwords.custom` | `string[]` | 设置页自定义热词（ADR-0004） |
| `asr.hotwords.presetPack` | `string` | 预置学科热词包 id |
| `agent.silent.enabled` | `boolean` | 静默 Agent 开关 |
| `agent.silent.throttleSeconds` | `number` | 语义段节流间隔 |
| `notes.outlineIntervalMs` | `number` | 笔记整理器触发间隔 |
| `transcript.flush.*` | `number` | 批量落库参数（见第三节），可调便于压测 |

**明确不进这张表**：任何布局相关的键（走 localStorage，ADR-0008）、任何密钥。

### 2.8 Drizzle 表形状示意

> **仅为形状示意，不是可编译代码**，也不是要粘贴进仓库的文件。真正的 schema 文件在 `src/lib/db/schema/` 下按本规格实现；`drizzle-orm@1.0.0-rc.4` 的确切 API 以当版官方文档为准（RC 期有变更风险，禁止凭记忆写）。这里只固化三件事：**用 `pg-core`、用 Postgres 类型、枚举用 text + CHECK**。

```ts
// 取两张最吃重的表做示意
export const csSession = pgTable('cs_session', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull(),          // recording|paused|ended|interrupted（CHECK，非 pg enum）
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationMs: integer('duration_ms').notNull().default(0),
  asrSnapshot: jsonb('asr_snapshot').$type<AsrSnapshot>().notNull(),   // 无 apiKey
  stats: jsonb('stats').$type<SessionStats>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (t) => [index('idx_session_user_started').on(t.userId, t.startedAt.desc())])

export const csTranscriptSegment = pgTable('cs_transcript_segment', {
  id: uuid('id').primaryKey(),                                          // = CRP transcriptAnchor
  sessionId: uuid('session_id').notNull().references(() => csSession.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  seq: integer('seq').notNull(),                                        // 应用层单调分配
  startMs: integer('start_ms').notNull(),
  endMs: integer('end_ms').notNull(),
  text: text('text').notNull(),                                         // 只存 final
  blockId: uuid('block_id'),                                            // 语义段
  asrMeta: jsonb('asr_meta').$type<AsrSegmentMeta>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
}, (t) => [
  uniqueIndex('uq_transcript_segment_session_seq').on(t.sessionId, t.seq),  // flush 幂等依据
  index('idx_transcript_segment_session_time').on(t.sessionId, t.startMs),
])
```

`jsonb` 列的 `$type<T>()` 只是编译期标注，**运行期形状由 Repository 边界的 zod 校验保证**——读出来的 jsonb 一律先过 schema 再进业务层，校验失败按各自兜底策略处理（CRP 渲染错误卡片、大纲回退上一版）。

---

## 三、明确「不入库」清单

这一节和表清单同等重要。**下列内容出现在任何 `cs_*` 表里，即视为违反本规格。**

| 内容 | 去哪 | 为什么 |
|---|---|---|
| **API key / token / secret** | Electron `safeStorage`（开发期 sessionStorage/内存 + 明示不加密） | 明文业务表存密钥是不可接受的；库文件会被备份、导出、日后上云 |
| **`.env` 里的值** | 只作开发期默认，进程内读取 | 环境配置不是用户数据；入库会造成"改了 .env 却不生效"的幽灵 |
| **音频原始数据（PCM / webm blob）** | P0 **不保存**；P1 存文件系统（`userData/recordings/`），DB 只存路径与元数据 | 90 分钟 16k 单声道 ≈ 100MB+。`bytea` 入 PGlite 会把 WASM 内存、IndexedDB 配额、VACUUM 全部拖死 |
| **ASR partial（未定稿）段** | 内存 ring buffer，只更新 UI 尾行 | 一秒数次，写库即自杀；且会被 final 覆盖，无留存价值 |
| **流式 token / reasoning delta** | 内存，`onFinish` 后只写最终态 | 同上 |
| **分屏比例、面板折叠、导航栏收起状态** | **localStorage**（ADR-0008 已定案，`useDefaultLayout`） | 布局是设备级偏好，不是用户数据；进库会让多设备（未来）互相打架 |
| **xyflow 节点像素坐标 / 视口 transform / 节点尺寸** | 运行期由 dagre 计算 | 是派生物。存了它，换布局算法就变成数据迁移 |
| **滚动位置、当前选中节点、主题色** | localStorage / 内存 | 同上 |
| **上课进行中的 CRP 渲染消息** | 内存，收尾批量快照（见 2.4） | 逐条落库 = 把 Agent 每次工具调用变成一次写 |
| **静默 Agent 的中间状态机状态** | 纯内存（ADR-0006：P0 不需要可回放图） | P0 不要求跨会话恢复 Agent 状态 |
| **AI 请求的完整 prompt / 原始响应体** | 不存（调试期打 console，不落库） | 体积大、含密钥风险、无产品价值 |

---

## 四、转写批量落库策略

这是 P0 唯一的高频写入路径，也是 ADR-0007 点名要压测的地方。

### 4.1 数据流

```
ASR onPartial ──→ UI 尾行（内存，不落库）
ASR onFinal   ──→ ring buffer（内存数组，容量上限 512 段，溢出时强制 flush）
                     │
                     ├─ 轻合并（见 4.3）
                     └─ flush 触发（见 4.2）→ 单条多值 INSERT（事务内）→ cs_transcript_segment
```

**ring buffer 是运行期真源**，UI 直接渲染它；数据库是**异步落后于内存的持久化副本**。UI 渲染绝不等待数据库。

### 4.2 flush 触发条件（任一满足即触发）

| 触发 | 阈值 | 说明 |
|---|---|---|
| 累计段数 | ≥ **20 段** | 主路径 |
| 距上次 flush | ≥ **10 秒** | 兜底，保证崩溃最多丢 10 秒 |
| buffer 字符数 | ≥ **4000 字** | 防长段落堆积 |
| 用户暂停 / 结束录音 | 立即 | 强制 |
| `visibilitychange → hidden` / `beforeunload` | 立即 | 强制 |
| ring buffer 溢出（512 段） | 立即 | 兜底保护 |

阈值全部读自 `cs_setting` 的 `transcript.flush.*`，**便于压测时不改代码调参**。

按 3 秒/段估算，90 分钟课 ≈ 1800 段 → **约 90 次 flush，每次 20 行**。这是极轻的写负载；ADR-0007 里"PGlite 慢于 better-sqlite3"的顾虑在这个量级上不成立——压测要验证的是**稳定性与 p95 延迟**，不是吞吐。

### 4.3 分段口径与轻合并

- **行的最小单位 = 一个 ASR final 段**，不是一句话、不是一个词。
- 若某些 dialect 的 final 段过碎（阶跃是累计全量 + stash 语义，百炼不同——差异必须在适配器内消化，ADR-0004），在 flush **之前**做一次轻合并：
  - 相邻两段满足「间隔 < 300ms」**且**「前一段文本 < 8 字」→ 合并为一行，`start_ms` 取前者、`end_ms` 取后者；
  - 合并后单行文本上限 **400 字**，超过不再合并。
- 目标行数：**500–1500 行 / 90 分钟课**。低于 500 说明合并过狠（回跳粒度太粗），高于 3000 说明适配器吐得太碎（该在适配器修，不是在这里补救）。
- **合并只做一次、只在落库前做**；UI 显示的是未合并的原始流（用户体验上更跟手）。

### 4.4 幂等与失败降级

- `seq` 由会话级内存计数器单调分配，**flush 失败重试时 seq 不变**；
- INSERT 带 `ON CONFLICT (session_id, seq) DO NOTHING` —— 重复提交是安全的空操作；
- 失败重试：指数退避（200ms / 800ms / 3s），最多 3 次；
- 三次仍失败：**不丢数据** —— 把待写批次序列化进 localStorage 溢出队列（key `classolo.transcript.overflow.<sessionId>`），弹 sonner 提示，下次启动时优先回灌；
- flush 期间**不阻塞** ASR 回调与 UI 渲染（flusher 是独立的异步任务，ring buffer 继续接收）。

### 4.5 建议主键与序号（结论重述）

- 主键：**`uuid`，应用层生成**（理由见 2.2）；
- 幂等键：**`UNIQUE (session_id, seq)`**；
- **不用** DB sequence / `serial` / `identity`：批量插入前需要知道 seq，且跨重试要稳定。

### 4.6 压测口径（ADR-0007 承诺项）

P0 早期必须跑一次，验收线：

1. 模拟 90 分钟、1800 个 final 段、按 4.2 阈值 flush；
2. **p95 单次 flush < 50ms**，最大不超过 300ms；
3. 全程 UI 无可感卡顿（转写流滚动、导图更新不掉帧）；
4. 落库总耗时 < 5s，库文件增量 < 10MB；
5. 中途强制 kill 进程，重启后丢失段数 ≤ 最近 10 秒；
6. 同时跑 `cs_note_outline` 的 30 秒 UPSERT，验证两条写路径不互相阻塞（**PGlite 单连接，写是串行的**——这一条是本压测的真正重点，见风险一节）。

结果不达标 → 触发 ADR-0007 的重审条件。

---

## 五、与 `question-schema.md` 的关系

[question-schema.md](./question-schema.md) 定义的是**运行时 JSON 形状**（zod schema，供 AI SDK `Output.object` 直接生成），本规格定义的是**存储形状**。两者的分工：

- **`Question` 整体作为 `jsonb` 存**（P1 表 `cs_question.payload`）。不要把 `payload` 判别联合、`scoring.rubric`、`stem` 拆成一堆列——那正是"关联地狱"，且题型可扩展的前提是存储对题型无感。
- **只提升需要索引 / join 的字段为列**：`id`（= `Question.id`）、`type`、`session_id`（来源课堂）、`generator`、`exam_weight`、`created_at`。
- **`knowledge.points[]` 例外**：「错题 → 知识点 → 加固题」是 P2 的核心闭环查询，JSONB 数组做不好这个 join。P1 落地时抽出关联表 `cs_question_point(question_id, point_id)`，jsonb 里保留原值作为生成时快照。
- **`srs` 调度字段不落 `cs_question`**：question-schema 自己已声明"复习调度字段由 SRS 引擎在答题记录表维护，不冗余在题目上"。本规格与之一致 → 落 `cs_review_state`。

**发现的一处不一致（P1 落地前需消解）**：question-schema 用 `meta.createdAt: number`（epoch ms），本规格全局用 `timestamptz`。建议方案是**保持 schema 不变、在 `QuestionRepository` 边界做转换**（与 2.4 处理 `RenderMessage.meta.createdAt` 的做法一致），而不是改协议。若 P1 落地时选择改 schema，需同步修订 question-schema.md 并在本文修订记录留痕。

---

## 六、P1 / P2 预留（`reserved`，不提前建表）

只占名字和语义，**字段留到届时再设计**。提前设计等于提前猜错。

### P1 — `reserved`

| 表 | 一句话 |
|---|---|
| `cs_recording` | 录音文件元数据（路径、时长、编码、大小）；音频本体在文件系统，不入库 |
| `cs_conversation` | 脱离课堂的独立对话会话头；`cs_chat_message` 届时放宽 `session_id` 并新增 `conversation_id` |
| `cs_knowledge_point` | 知识点节点（章节树）；题目、卡片、掌握度共用的 ID 体系，**必须先于出题功能定稿** |
| `cs_knowledge_card` | 知识卡片（标题、markdown 正文、来源 session + transcript anchor） |
| `cs_review_state` | SRS 调度状态（一卡/一题一行：due、stability、difficulty、reps、lapses）；引擎候选 ts-fsrs，选型需走 ADR |
| `cs_question` | 题目；`payload jsonb` 存整个 Question，见第五节 |
| `cs_question_point` | 题目 ↔ 知识点关联表，支撑反向定位 |
| `cs_attempt` | 答题记录（答案、得分、错因标签），驱动掌握度与 SRS |
| `cs_material` | 素材/教材条目元数据；文件本体在文件系统 |

### P2 — `reserved`

| 表 | 一句话 |
|---|---|
| `cs_mistake` | 错题归因记录：attempt → 知识点 → 加固题的链路 |
| `cs_mock_exam` | 押题卷：组卷快照 + 题目 id 列表 + 考期信息 |
| `cs_mastery_snapshot` | 知识点掌握度时间序列，供学习画像可视化（recharts） |

---

## 七、迁移到 Supabase：不变的部分

**完全不变（这是 ADR-0007 选 PGlite 的全部意义）**

- 全部 `cs_*` 表名（前缀 P0 就位）、列名、`pg-core` 表定义文件本身；
- 所有类型（`uuid` / `timestamptz` / `jsonb` / `text` / `integer` / `boolean`）——无一个是 SQLite 妥协产物；
- 所有索引、唯一约束、部分索引、外键与 `ON DELETE CASCADE` 语义；
- drizzle-kit 生成的 migration SQL；
- 全部业务查询代码与 Repository 层签名（因为 P0 就在 `WHERE user_id = ?` 上过滤）。

**需要动的（穷举，只有四项）**

1. **连接驱动**：`drizzle-orm/pglite` → Supabase 侧驱动。改动面 = `src/lib/db/index.ts` 一个文件（这也正是它作为唯一入口存在的理由）。
2. **`user_id` 回填**：`UPDATE cs_* SET user_id = <auth.users.id> WHERE user_id = '00000000-0000-0000-0000-000000000001'`，配套一次性上云脚本（导出本地库 → 批量插入 → 校验行数）。
3. **RLS 策略新增**：每表 `ENABLE ROW LEVEL SECURITY` + `USING (user_id = auth.uid())`。P0 不写 RLS（单用户无意义），但列的存在让这一步是纯增量。
4. **`cs_setting` 主键**：`key` → `(user_id, key)`。**这是唯一一处主键变更**，已知、已记录。

**不变清单里的一个前提**：任何时候都不许在 schema 里出现 SQLite-only 或 PGlite-only 的构造。若发现某个 Postgres 特性在 PGlite 下不可用，正确做法是**退到两边都支持的写法**，而不是写一套 PGlite 专用的。

---

## 八、风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| **PGlite 单连接、写串行** | 转写 flush 与大纲 UPSERT 互相排队；某次大 JSONB 写会推迟转写落库 | 两条写路径共用一个串行队列并**给转写更高优先级**；大纲 UPSERT 走 30 秒节流 + 哈希去重；压测第 6 项专测此场景 |
| **多实例打开同一个库** | 开发期多标签页各开一个 `idb://classolo`，或 Electron main + renderer 各建实例 → **数据损坏** | Electron 期**只允许 main process 持有实例**，renderer 一律走 IPC；开发期加单标签守卫（Web Locks / BroadcastChannel），检测到第二个标签页时降级为只读并提示 |
| **`relaxedDurability` 崩溃丢数据** | 最近一次 flush 可能未落盘 | flush 间隔上限 10 秒（丢失窗口有界）；暂停/结束/页面卸载强制 flush；localStorage 溢出队列兜底；**验收标准明确写"丢失 ≤ 10 秒"，不追求零丢失** |
| **大纲 JSONB 频繁 UPDATE 导致行膨胀 / TOAST 重写** | 长课后库文件虚胖、读变慢 | 节流 + 内容哈希去重（结构没变不写）；会话结束后可考虑一次维护操作（PGlite 的 autovacuum 行为属未核实项，落地时实测） |
| **ADR-0007 已知的写入性能代价** | 90 分钟课写入不达标 | 本文第 4.6 节的压测口径就是它的验收；不达标即触发 ADR-0007 重审（回退方向 better-sqlite3 + 接受迁移期重写） |
| **中文检索能力弱** | Agent 检索历史文稿召回差 | P0 靠 `ILIKE` + 小数据量兜住；P1 跨会话检索前必须先做检索方案 ADR，不要临时糊一个 |
| **密钥泄漏面** | 开发期浏览器无 `safeStorage` 等价物 | 开发期密钥只进 sessionStorage / 内存并在 UI 明示；**任何情况下不入库**；`base_url` 落库前剥离 query string |
| **RC 期依赖变更** | drizzle-orm 1.0-rc 的 API 可能在正式版调整 | 版本已钉死（`1.0.0-rc.4`，非 `^`）；升级时按 lessons 机制记录踩坑 |

### 未核实项（落地时必须实测，禁止凭记忆断言）

1. PGlite 下 `gen_random_uuid()` / `pgcrypto` 是否可用 —— **本规格已通过"应用层生成 uuid"绕开**，无需依赖；
2. drizzle-kit migration 在 PGlite（尤其 Electron main process）下的具体调用形式；
3. Electron `app://` 自定义协议是否被判定为 secure context（决定 `crypto.randomUUID()` 可用性）；
4. PGlite 的 autovacuum / 手动维护操作行为；
5. pgvector 等扩展在 PGlite 的可用性（P1 检索方案的前置调研，P0 不依赖）。

---

## 修订记录

| 日期 | 变更 | 关联 |
|---|---|---|
| 2026-08-30 | 初版：P0 七表定案、不入库清单、转写批量策略、P1/P2 预留 | ADR-0016 |
