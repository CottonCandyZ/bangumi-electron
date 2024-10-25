import { appPath, isDev } from '@main/env'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path, { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const sqlite: BetterSqlite3.Database = new BetterSqlite3(
  resolve(appPath()('userData'), 'store.sqlite'),
  {
    verbose: isDev ? console.log : undefined,
  },
)

const db = drizzle(sqlite)

export type ExecuteType = {
  sql: string
  params: unknown[]
  method: 'run' | 'all' | 'get' | 'values'
}

export type ExecuteBatchType = {
  queries: ExecuteType[]
}

export const execute = async ({ sql, params, method }: ExecuteType) => {
  const pre = sqlite.prepare(sql)
  const ret = pre[method](...params) as Record<string, unknown> | Array<Record<string, unknown>>
  return toDrizzleResult(ret)
}

/** only for insert & delete, no query return here */
export const executeBatch = async ({ queries }: ExecuteBatchType) => {
  console.log(queries)
  const pres = Array(queries.length)
  queries.forEach((item, index) => {
    pres[index] = sqlite.prepare(item.sql)
  })
  const batch = sqlite.transaction((params: unknown[]) => {
    params.forEach((param, index) => pres[index].run(param))
  })
  // FIXME: NO TEST HERE, USE WITH CAUTION
  batch(queries.map((item) => item.params))
}

function toDrizzleResult(rows: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (!rows) {
    return []
  }
  // map object to array
  if (Array.isArray(rows)) {
    return rows.map((row) => {
      return Object.keys(row).map((key) => row[key])
    })
  } else {
    return Object.keys(rows).map((key) => rows[key])
  }
}

// FIXME: RUN ONLY WHEN START?
export async function initDB() {
  migrate(db, {
    migrationsFolder: path.join(__dirname, '../../drizzle'),
  })
}
