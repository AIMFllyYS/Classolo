# ADR-0016: 本地数据 Schema —— P0 七表最小集 + `cs_` 前缀 + 密钥不入库

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 规格正文：[docs/specs/local-schema.md](../specs/local-schema.md)（软约束，实现以其为准）

## 背景

ADR-0007 定下 PGlite + Drizzle `pg-core`，但没有定 **存什么、存成什么形状**。P0 要落地工作台、实时转写、思维导图笔记、CRP 渲染、课堂 Agent、设置六个功能，需要一次性回答四个绑在一起的问题：① P0 到底要几张表；② 45–90 分钟高频转写怎么落库才不拖垮 PGlite（ADR-0007 已知的性能代价）；③ 用户在 exe 里填的 API key 放哪；④ 怎么保证最晚阶段迁 Supabase 时 schema/SQL 真的零重写，而不只是口号。

没有这份定案，多 Agent 协作下必然出现各建各表、各起各名，以及"图省事把一节课塞进一个 JSON 行"。

## 面临的选项

**表粒度**
- A. 极简三表（session / transcript / kv），笔记大纲、渲染消息、对话全部塞进 `cs_session` 的 jsonb 列 —— 表最少，但把大 JSONB 和热状态行焊在一起，且渲染消息无法按模块过滤、无法原子更新。
- B. **七表**（session / transcript_segment / note_outline / render_message / chat_message / provider_profile / setting），每张对应一个 P0 功能。
- C. 关系化彻底拆（大纲节点一行一个、CRP props 拆列、题目按题型分表）—— 关联地狱，且题型可扩展性被存储绑死。

**转写落库**
- 逐句 INSERT（每秒数次写）；整课一个巨型 JSON 行（无法按时间轴查、无法给 Agent 检索）；**内存 ring buffer + 按段批量 INSERT**。

**渲染消息（CRP）**
- 每条落库；完全不落库（纯内存）；**上课中内存 + 收尾批量快照**。

**密钥**
- 存业务表明文 / 存业务表加密列（密钥的密钥又放哪）/ **走 OS 级凭据存储（Electron `safeStorage`），库里只留 `credential_ref` + `has_credential`**。

**主键与序号**
- DB `serial`/`identity`；复合主键 `(session_id, seq)` + anchor 用 `"sessionId:seq"` 字符串；**应用层生成 `uuid` + `(session_id, seq)` 唯一约束**。

## 决定

采纳 **B + ring buffer 批量 + CRP 收尾快照 + 密钥走 safeStorage + 应用层 uuid**，完整规格见 [docs/specs/local-schema.md](../specs/local-schema.md)：

1. **P0 七张表，全部 `cs_` 前缀**：`cs_session`、`cs_transcript_segment`、`cs_note_outline`、`cs_render_message`、`cs_chat_message`、`cs_provider_profile`、`cs_setting`。
2. **每张业务表带 `user_id uuid NOT NULL`**，P0 恒为匿名常量 `00000000-0000-0000-0000-000000000001`；不建 `cs_user` 表。
3. **类型口径对齐 Supabase**：`uuid` / `timestamptz` / `jsonb` / `text`+CHECK（**禁 pg enum**）/ `integer` 毫秒偏移；主键一律应用层 `crypto.randomUUID()` 生成。
4. **转写**：final 段进内存 ring buffer，按「20 段 / 10 秒 / 4000 字 / 暂停结束卸载」四类触发批量 INSERT，`ON CONFLICT (session_id, seq) DO NOTHING` 幂等，三次重试失败降级 localStorage 溢出队列。目标 ~90 次写 / 90 分钟课。
5. **CRP 渲染消息**：上课中纯内存，暂停/结束/卸载时一条一行批量快照落 `cs_render_message`（不逐条写、不折叠成数组）。
6. **笔记**：只存稳定 id 的大纲树 JSON，**xyflow 像素坐标不入库**；30 秒节流 + 内容哈希去重 UPSERT。
7. **密钥永不入库**：Electron `safeStorage` 代持（开发期 sessionStorage/内存 + UI 明示不加密），表里只有 `credential_ref` 与 `has_credential`；`.env` 只作开发默认值，不入库；`base_url` 落库前剥离 query string。
8. **布局比例继续走 localStorage**（ADR-0008 不变），音频本体 P0 不保存、P1 走文件系统。
9. **P1/P2 只预留表名与一句话语义**，不提前建表、不提前设计字段。
10. 规格性质为**软约束**：实现中发现不够用时，允许深度分析后修订规格（改 spec + 必要时补 ADR + 批量结算），但**禁止静默另起一套表**。

## 理由

- **七表不是妥协，是每张都有不可替代的理由**：`cs_note_outline` 与 `cs_session` 是 1:1，本可合并，分开是为了把 TOAST 大字段和高频 UPDATE 的热状态行隔离；`cs_render_message` 与 `cs_chat_message` 本可合并成事件表，分开是因为二者列集几乎不重合（合并后一半列恒 NULL + 条件 CHECK 地狱）、生命周期不同（可撤回 vs append-only），且合并会在存储层重新焊死「渲染模块与 Agent 解耦」这条架构红线。
- **ring buffer 让 ADR-0007 的性能顾虑失效**：90 次批量写对 PGlite 是极轻负载。真正要压测的是 p95 延迟与「转写 flush 和大纲 UPSERT 在单连接上互相排队」，而不是吞吐。
- **应用层 uuid 一石三鸟**：落库前就能被 CRP `transcriptAnchor` 引用；重试幂等；顺带绕开「PGlite 是否有 `gen_random_uuid()`」这个未核实项。
- **`user_id` 从第一天就在**，Repository 从第一天就 `WHERE user_id = ?` 过滤 —— 迁移期 RLS 是纯增量，业务查询零改动。这一列每课约 24KB，是全项目性价比最高的 16 字节。
- **密钥红线不可商量**：库文件会被备份、导出、日后整体上云，明文密钥的爆炸半径不可接受。

## 放弃了什么

- **极简三表的省事**：多维护四张表的 Repository 与迁移。
- **复合主键 `(session_id, seq)` 省下的一列 + 一个索引**：为了让 CRP 的 `transcriptAnchor: string` 保持"一个不透明 id"，不把存储细节漏进协议层，多付一个唯一索引。
- **零丢失持久化**：`relaxedDurability` 下崩溃最多丢最近 10 秒转写。验收标准明写「丢失 ≤ 10 秒」，不追求零丢失（追求它就要放弃 relaxedDurability，代价是上课时的写入延迟）。
- **P0 的中文全文检索与向量召回**：只有 `ILIKE` + 小数据量兜底（一节课 500–1500 行，够用）。跨会话语义检索推迟到 P1，且必须先出检索方案 ADR。
- **上课中每条渲染消息的实时持久化**：进程崩溃会丢掉本次课已渲染但未快照的组件（文稿与大纲不丢）。产品上可接受。
- **P1/P2 表的提前设计**：换来的是不提前猜错。

## 何时重审

- 4.6 节压测不达标时（同时触发 ADR-0007 的重审——回退方向 better-sqlite3 + 接受迁移期重写）；
- P1 开工时：`cs_conversation` 落地会放宽 `cs_chat_message.session_id`，`cs_question` 落地会确认与 [question-schema.md](../specs/question-schema.md) 的 `createdAt` 类型口径（epoch ms vs `timestamptz`）；
- 跨会话语义检索立项时（是否引入向量/分词方案，需新 ADR）；
- 生态接入期真正迁 Supabase 前（验证「只改连接驱动 + `user_id` 回填 + RLS + `cs_setting` 主键」四项确实穷举）；
- drizzle-orm 1.0 正式版发布、RC 期 API 变更落定时。
