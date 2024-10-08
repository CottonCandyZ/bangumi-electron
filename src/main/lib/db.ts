import { appPath, isDev } from '@main/env'
import BetterSqlite3 from 'better-sqlite3'
import { resolve } from 'node:path'

export const db: BetterSqlite3.Database = new BetterSqlite3(
  resolve(appPath()('userData'), 'store.sqlite'),
  {
    verbose: isDev ? console.log : undefined,
  },
)
