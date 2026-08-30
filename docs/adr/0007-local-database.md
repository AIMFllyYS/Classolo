# ADR-0007: 本地数据库 —— PGlite + Drizzle ORM（1.0 RC）

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 决策现场：`docs/designs/library-showcase/local-database.html`

## 背景

本地优先 + Electron 免安装分发；最晚阶段迁生态 Supabase（Postgres），要求 schema/SQL 零重写；开发期（未套 Electron 壳）浏览器可跑是加分项。转写流高频增量写入（45-90 分钟/课）。

## 面临的选项

- **@electric-sql/pglite 0.5.8**：内嵌 Postgres（WASM），0 依赖，Node 文件 / 浏览器 IndexedDB 双持久化，live query；WASM ~16MB 打进 exe
- better-sqlite3 13.0.3：更快，但 SQLite 方言堵死 Supabase 迁移（Drizzle 官方明确 pg/sqlite 不能共用 table 定义），Electron 需 rebuild
- node:sqlite：Node 22.11 下仍需实验旗标；Dexie/localforage：无 SQL，主库不成立
- ORM：Drizzle（运行时 0 依赖，官方 PGlite 指南要求 @rc）vs Prisma（74.5MB client，PGlite 仅社区 adapter）

## 决定

**PGlite ^0.5.8 + drizzle-orm 1.0.0-rc.4**（`pg-core` + `drizzle-orm/pglite` 驱动），封装层 `src/lib/db/`。开发期浏览器 IndexedDB + `relaxedDurability`；Electron 期移到 main process 的 `app.getPath('userData')` 文件库（IPC 供 renderer）。

## 理由

唯一同时满足免安装、双环境、Postgres 方言与 Supabase 完全一致的方案；迁移 = 换连接驱动 + `cs_` 表前缀。

## 放弃了什么

better-sqlite3 的原生性能（官方基准 2.5 万条事务 insert：0.019s vs PGlite Memory 0.292s——已知代价）。缓解：转写先内存 ring buffer 按段批量 INSERT。**P0 早期必须对 45-90 分钟课做一次写入压测（未核实项）。**

## 何时重审

压测不达标时（回退方向：better-sqlite3 + 接受迁移期重写）；Drizzle 1.0 正式版发布时（解除 RC 钉版）。
