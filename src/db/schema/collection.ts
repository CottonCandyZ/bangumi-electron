import { subject } from '@db/schema/subject'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { relations } from 'drizzle-orm'
import { sqliteTable } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'

export const collectedSubject = sqliteTable('CollectedSubject', {
  subject_id: t.integer().primaryKey().notNull(),
  comment: t.text(),
  vol_status: t.integer().notNull(),
  ep_status: t.integer().notNull(),
  subjectType: t.integer().$type<SubjectType>().notNull(),
  type: t.integer().$type<CollectionType>().notNull(),
  rate: t.integer().$type<CollectionData['type']>().notNull(),
  private: t.integer({ mode: 'boolean' }).notNull(),
  update_at: t.integer({ mode: 'timestamp' }).notNull(),
  last_update_at: t.integer({ mode: 'timestamp_ms' }).notNull(),
})

export const collectedSubjectRelation = relations(collectedSubject, ({ one, many }) => ({
  subject: one(subject, { fields: [collectedSubject.subject_id], references: [subject.id] }),
  tags: many(collectedSubjectTags),
}))

export const collectedSubjectTags = sqliteTable('CollectedSubjectTags', {
  subject_id: t.integer().notNull(),
  name: t.text().notNull(),
  count: t.integer().notNull(),
})
