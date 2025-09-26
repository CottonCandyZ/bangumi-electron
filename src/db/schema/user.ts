import { sqliteTable } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const userLoginInfo = sqliteTable('UserLoginInfo', {
  email: t.text().primaryKey().notNull(),
  password: t.text(),
  id: t.integer().notNull(),
})

export const userSession = sqliteTable('UserSession', {
  user_id: t.int().notNull(),
  access_token: t.text().notNull(),
  refresh_token: t.text().notNull(),
  expires_in: t.integer().notNull(),
  create_time: t
    .integer({ mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
})
