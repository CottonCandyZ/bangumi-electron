import type Database from 'better-sqlite3'
import type { Subject } from '../../shared/types/subject'
import { saveSubjects } from './subject-repository'

export type ExecuteType = {
  sql: string
  params: unknown[]
  method: 'run' | 'all' | 'get' | 'values'
}
export type ExecuteBatchType = { queries: ExecuteType[] }

/** All runtime writes share the worker connection; main only opens SQLite for startup/auth reads. */
export function createDatabaseApi(sqlite: Database.Database) {
  const statements = new Map<string, Database.Statement>()
  function prepare(sql: string, raw = false) {
    const key = `${raw}:${sql}`
    const cached = statements.get(key)
    const statement = cached ?? sqlite.prepare(sql)
    if (!cached && raw) statement.raw()
    statements.delete(key)
    statements.set(key, statement)
    if (statements.size > 200) statements.delete(statements.keys().next().value!)
    return statement
  }
  const batch = sqlite.transaction((queries: ExecuteType[]) => {
    for (const { sql, params } of queries) prepare(sql).run(...params)
  })
  return {
    db: ({ sql, params, method }: ExecuteType): unknown[] => {
      const statement = prepare(sql, method !== 'run')
      if (method === 'run') return Object.values(statement.run(...params))
      if (method === 'get') return (statement.get(...params) as unknown[] | undefined) ?? []
      return statement.all(...params)
    },
    dbBatch: ({ queries }: ExecuteBatchType) => batch(queries),
    dbSaveSubjects: (subjects: Subject[]) => saveSubjects(sqlite, subjects),
  }
}
export type DatabaseApi = ReturnType<typeof createDatabaseApi>
