import { appPath, isDev } from '@main/env'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path, { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export const sqlite: BetterSqlite3.Database = new BetterSqlite3(
  resolve(appPath()('userData'), 'store.sqlite'),
  {
    verbose: isDev ? console.log : undefined,
  },
)
// The collection worker has its own connection. Readers must not wait for its write batches.
sqlite.pragma('journal_mode = WAL')

const db = drizzle(sqlite)

export async function initDB() {
  migrate(db, {
    migrationsFolder: path.join(__dirname, '../../drizzle'),
  })
}
