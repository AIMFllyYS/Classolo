import { PGlite } from '@electric-sql/pglite'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'

import { applyInitMigration } from './migrate'

export type ClassoloDb = PgliteDatabase & { $client: PGlite }

export interface OpenDatabaseOptions {
  /** PGlite data dir. Omit for in-memory (probes / Node). */
  dataDir?: string
  relaxedDurability?: boolean
}

function defaultDataDir(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return 'idb://classolo'
}

export async function openDatabase(
  options: OpenDatabaseOptions = {},
): Promise<ClassoloDb> {
  const dataDir = 'dataDir' in options ? options.dataDir : defaultDataDir()
  const client = dataDir
    ? new PGlite(dataDir, {
        relaxedDurability: options.relaxedDurability ?? true,
      })
    : new PGlite()
  await client.waitReady
  await applyInitMigration(client)
  return drizzle({ client }) as ClassoloDb
}

let singleton: Promise<ClassoloDb> | null = null

export function getDb(): Promise<ClassoloDb> {
  if (!singleton) singleton = openDatabase()
  return singleton
}

export async function resetDbSingletonForTests(): Promise<void> {
  if (!singleton) return
  const db = await singleton
  await db.$client.close()
  singleton = null
}
