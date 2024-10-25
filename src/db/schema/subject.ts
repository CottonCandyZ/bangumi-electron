import { sqliteTable } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { CoverImages, InfoBox } from '@renderer/data/types/subject'

export const subject = sqliteTable('Subject', {
  id: t.integer().primaryKey(),
  date: t.integer({ mode: 'timestamp' }),
  platform: t.text().notNull(),
  name: t.text().notNull(),
  name_cn: t.text().notNull(),
  summary: t.text().notNull(),
  images: t.text({ mode: 'json' }).$type<CoverImages>().notNull(),
  total_episodes: t.integer().notNull(),
  eps: t.integer().notNull(),
  infobox: t.text({ mode: 'json' }).$type<InfoBox[]>().notNull(),
  volumes: t.integer().notNull(),
  series: t.integer({ mode: 'boolean' }).notNull(),
  locked: t.integer({ mode: 'boolean' }).notNull(),
  nsfw: t.integer({ mode: 'boolean' }).notNull(),
  type: t.integer().notNull(),
})

export const subjectRelation = relations(subject, ({ one, many }) => ({
  rating: one(subjectRate),
  collection: one(subjectCollection),
  tags: many(subjectTags),
  ratingCount: one(subjectRatingCount),
}))

export const subjectRate = sqliteTable('SubjectRate', {
  subject_id: t.integer().primaryKey(),
  total: t.integer().notNull(),
  rank: t.integer().notNull(),
  score: t.integer().notNull(),
})

export const subjectRateRelation = relations(subjectRate, ({ one }) => ({
  subject: one(subject, {
    fields: [subjectRate.subject_id],
    references: [subject.id],
  }),
}))

export const subjectRatingCount = sqliteTable('SubjectRatingCount', {
  subject_id: t.integer().primaryKey(),
  '1': t.integer().notNull(),
  '2': t.integer().notNull(),
  '3': t.integer().notNull(),
  '4': t.integer().notNull(),
  '5': t.integer().notNull(),
  '6': t.integer().notNull(),
  '7': t.integer().notNull(),
  '8': t.integer().notNull(),
  '9': t.integer().notNull(),
  '10': t.integer().notNull(),
})

export const subjectRatingCountRelation = relations(subjectRatingCount, ({ one }) => ({
  subject: one(subject, {
    fields: [subjectRatingCount.subject_id],
    references: [subject.id],
  }),
}))

export const subjectTags = sqliteTable('SubjectTags', {
  subject_id: t.integer().notNull(),
  name: t.text().notNull(),
  count: t.integer().notNull(),
})

export const subjectTagsRelation = relations(subjectTags, ({ one }) => ({
  subject: one(subject, {
    fields: [subjectTags.subject_id],
    references: [subject.id],
  }),
}))

export const subjectCollection = sqliteTable('SubjectCollection', {
  subject_id: t.integer().primaryKey(),
  on_hold: t.integer().notNull(),
  dropped: t.integer().notNull(),
  wish: t.integer().notNull(),
  collect: t.integer().notNull(),
  doing: t.integer().notNull(),
})

export const subjectCollectionRelation = relations(subjectCollection, ({ one }) => ({
  subject: one(subject, {
    fields: [subjectCollection.subject_id],
    references: [subject.id],
  }),
}))
