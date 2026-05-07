import { client } from '@renderer/lib/client'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from '@db/index'

export const db = drizzle(
  async (sql, params, method) => {
    try {
      const rows = await client.db({ sql, params, method })
      return { rows: rows }
    } catch (e: unknown) {
      console.error(
        'Error from sqlite proxy server: ',
        (e as { response: { data: string } }).response.data,
      )
      return { rows: [] }
    }
  },
  async (
    queries: { sql: string; params: unknown[]; method: 'all' | 'run' | 'get' | 'values' }[],
  ) => {
    try {
      await client.dbBatch({ queries })
      return [{ rows: [] }]
    } catch (e: unknown) {
      console.error(
        'Error from sqlite proxy server:',
        (e as { response: { data: string } }).response.data,
      )
      throw e
    }
  },
  { schema },
)
