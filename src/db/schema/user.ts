import { sqliteTable } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
import { UserGroup } from '@renderer/data/types/user'

export const userLoginInfo = sqliteTable('UserLoginInfo', {
  email: t.text().primaryKey().notNull(),
  password: t.text(),
  id: t.integer().notNull(),
})

export const userLoginInfoRelation = relations(userLoginInfo, ({ one }) => ({
  userInfo: one(userInfo),
}))

export const userInfo = sqliteTable('UserInfo', {
  id: t.integer().primaryKey().notNull(),
  username: t.text().notNull(),
  nickname: t.text().notNull(),
  user_group: t.integer().$type<UserGroup>().notNull(),
  avatar: t.text().notNull(),
  sign: t.text().notNull(),
  url: t.text().notNull(),
  time_offset: t.integer().notNull(),
})

export const userInfoRelation = relations(userInfo, ({ many, one }) => ({
  sessions: many(userSession),
  loginInfo: one(userLoginInfo, {
    fields: [userInfo.id],
    references: [userLoginInfo.id],
  }),
}))

export const userSession = sqliteTable('UserSession', {
  user_id: t.int().notNull(),
  access_token: t.text().notNull(),
  refresh_token: t.text().notNull(),
  expires_in: t.integer().notNull(),
  create_time: t
    .integer({ mode: 'timestamp' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
})

export const userSessionRelation = relations(userSession, ({ one }) => ({
  user: one(userInfo, {
    fields: [userSession.user_id],
    references: [userInfo.id],
  }),
}))
