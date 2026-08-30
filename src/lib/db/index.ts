/**
 * 本目录是 PGlite + Drizzle 的唯一入口（ADR-0007）。
 * 业务代码禁止直接 import '@electric-sql/pglite' / 'drizzle-orm'，一律经由此处的 Repository。
 * schema 用 drizzle-orm/pg-core（Postgres 方言）——生态迁移 Supabase 时只换连接驱动，禁止改方言。
 *
 * 持久化策略（ADR-0007）：
 *   开发期（浏览器）：IndexedDB + relaxedDurability
 *   Electron 期：main process 的 app.getPath('userData') 文件库，IPC 供 renderer
 * 写入策略：转写流先内存 ring buffer，按段批量 INSERT（禁止逐句写库）。
 */
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

let client: PGlite | null = null

export function getDb() {
  if (!client) {
    client = new PGlite('idb://classolo', { relaxedDurability: true })
  }
  return drizzle({ client })
}
