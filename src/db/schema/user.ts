import { sqliteTable } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { UserGroup, UserInfo } from '@renderer/data/types/user'

export const userLoginInfo = sqliteTable('UserLoginInfo', {
  email: t.text().primaryKey().notNull(),
  password: t.text(),
  id: t.integer().notNull(),
})

export const userInfo = sqliteTable('UserInfo', {
  id: t.integer().primaryKey().notNull(),
  username: t.text().notNull(),
  nickname: t.text().notNull(),
  user_group: t.integer().$type<UserGroup>().notNull(),
  avatar: t.text({ mode: 'json' }).$type<UserInfo['avatar']>().notNull(),
  sign: t.text().notNull(),
  url: t.text().notNull(),
  time_offset: t.integer().notNull(),
  last_update_at: t.integer({ mode: 'timestamp_ms' }).notNull(),
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
