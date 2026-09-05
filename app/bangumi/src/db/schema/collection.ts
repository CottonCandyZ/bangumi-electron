import { integer, text, sqliteTable, primaryKey, index } from 'drizzle-orm/sqlite-core'
import type {
  CollectionCommand,
  CollectionConflict,
  CollectionFields,
  CollectionSnapshot,
  CollectionSyncStatus,
  LocalAccount,
  SyncAttempt,
} from '@shared/collection-sync'
import type { Episode } from '@shared/types/episode'
import type { SlimSubject } from '@shared/types/subject'

export const localCollections = sqliteTable(
  'LocalCollection',
  {
    userId: integer('user_id').notNull(),
    subjectId: integer('subject_id').notNull(),
    subject: text('subject', { mode: 'json' }).$type<SlimSubject>().notNull(),
    base: text('base', { mode: 'json' }).$type<CollectionSnapshot>().notNull(),
    local: text('local', { mode: 'json' }).$type<CollectionSnapshot>().notNull(),
    retained: text('retained', { mode: 'json' }).$type<CollectionFields>(),
    revision: integer('revision').notNull().default(0),
    status: text('status').$type<CollectionSyncStatus>().notNull().default('clean'),
    conflict: text('conflict', { mode: 'json' }).$type<CollectionConflict>(),
    attempt: text('attempt', { mode: 'json' }).$type<SyncAttempt>(),
    error: text('error'),
    updatedAt: integer('updated_at').notNull(),
    syncedAt: integer('synced_at'),
    epStatus: integer('ep_status').notNull().default(0),
    volStatus: integer('vol_status').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.subjectId] }),
    index('local_collection_pending').on(table.userId, table.status),
  ],
)
export const collectionActions = sqliteTable(
  'CollectionAction',
  {
    sequence: integer('sequence').primaryKey({ autoIncrement: true }),
    actionId: text('action_id').notNull().unique(),
    userId: integer('user_id').notNull(),
    subjectId: integer('subject_id').notNull(),
    command: text('command', { mode: 'json' }).$type<CollectionCommand>().notNull(),
    before: text('before', { mode: 'json' }).$type<CollectionSnapshot>().notNull(),
    baseRevision: integer('base_revision').notNull(),
    createdAt: integer('created_at').notNull(),
    acknowledgedAt: integer('acknowledged_at'),
  },
  (table) => [
    index('collection_action_pending').on(table.userId, table.subjectId, table.acknowledgedAt),
  ],
)
export const collectionEpisodes = sqliteTable(
  'CollectionEpisodeResource',
  {
    episodeId: integer('episode_id').primaryKey(),
    subjectId: integer('subject_id').notNull(),
    data: text('data', { mode: 'json' }).$type<Episode>().notNull(),
  },
  (table) => [index('collection_episode_subject').on(table.subjectId)],
)
export const localAccounts = sqliteTable('LocalAccount', {
  userId: integer('user_id').primaryKey(),
  profile: text('profile', { mode: 'json' }).$type<LocalAccount>().notNull(),
  listComplete: integer('list_complete', { mode: 'boolean' }).notNull().default(false),
  lastSyncedAt: integer('last_synced_at'),
})
