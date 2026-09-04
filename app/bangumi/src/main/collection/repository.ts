import type BetterSqlite3 from 'better-sqlite3'
import { and, asc, desc, eq, isNull, lte } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import {
  collectionActions,
  collectionEpisodes,
  localAccounts,
  localCollections,
} from '../../db/schema/collection'
import { subject as subjects } from '../../db/schema/subject'
import {
  applyCommand,
  emptySnapshot,
  type CollectionCommand,
  type LocalAccount,
  type LocalCollectionRecord,
  type RemoteCollection,
} from '../../shared/collection-sync'
import type { CollectionData, Collections, CollectionEpisodes } from '../../shared/types/collection'
import type { SlimSubject, SubjectType } from '../../shared/types/subject'

export class CollectionRepository {
  private db
  constructor(private sqlite: BetterSqlite3.Database) {
    this.db = drizzle(sqlite)
  }
  transaction<T>(fn: () => T): T {
    return this.sqlite.transaction(fn)()
  }
  get(userId: number, subjectId: number): LocalCollectionRecord | undefined {
    return this.db
      .select()
      .from(localCollections)
      .where(and(eq(localCollections.userId, userId), eq(localCollections.subjectId, subjectId)))
      .get()
  }
  all(userId: number) {
    return this.db
      .select()
      .from(localCollections)
      .where(eq(localCollections.userId, userId))
      .orderBy(desc(localCollections.updatedAt), asc(localCollections.subjectId))
      .all()
  }
  removed(userId: number) {
    return this.all(userId)
      .filter((record) => record.local.collection === null && record.retained !== null)
      .slice(0, 30)
  }
  put(record: LocalCollectionRecord) {
    this.db
      .insert(localCollections)
      .values(record)
      .onConflictDoUpdate({
        target: [localCollections.userId, localCollections.subjectId],
        set: record,
      })
      .run()
  }
  account(userId: number) {
    return this.db.select().from(localAccounts).where(eq(localAccounts.userId, userId)).get()
  }
  saveAccount(profile: LocalAccount) {
    this.db
      .insert(localAccounts)
      .values({ userId: profile.id, profile })
      .onConflictDoUpdate({ target: localAccounts.userId, set: { profile } })
      .run()
  }
  completeList(userId: number) {
    this.db
      .update(localAccounts)
      .set({ listComplete: true, lastSyncedAt: Date.now() })
      .where(eq(localAccounts.userId, userId))
      .run()
  }
  actions(userId: number, subjectId: number) {
    return this.db
      .select()
      .from(collectionActions)
      .where(
        and(
          eq(collectionActions.userId, userId),
          eq(collectionActions.subjectId, subjectId),
          isNull(collectionActions.acknowledgedAt),
        ),
      )
      .orderBy(asc(collectionActions.sequence))
      .all()
  }
  ensure(userId: number, subjectId: number, summary?: SlimSubject): LocalCollectionRecord {
    const current = this.get(userId, subjectId)
    if (current) return current
    const cached = this.db.select().from(subjects).where(eq(subjects.id, subjectId)).get()
    const subject: SlimSubject = summary ?? {
      id: subjectId,
      name: cached?.name ?? `条目 #${subjectId}`,
      name_cn: cached?.name_cn ?? '',
      type: cached?.type ?? 2,
      date: cached?.date ?? null,
      images: cached?.images ?? { small: '', grid: '', medium: '', large: '', common: '' },
      tags: [],
      eps: cached?.eps ?? 0,
      volumes: cached?.volumes ?? 0,
      score: 0,
      rank: 0,
      collection_total: 0,
    }
    const record: LocalCollectionRecord = {
      userId,
      subjectId,
      subject,
      base: emptySnapshot(),
      local: emptySnapshot(),
      retained: null,
      revision: 0,
      status: 'clean',
      conflict: null,
      attempt: null,
      error: null,
      updatedAt: Date.now(),
      syncedAt: null,
      epStatus: 0,
      volStatus: 0,
    }
    this.put(record)
    return record
  }
  command(command: CollectionCommand) {
    validateCommand(command)
    return this.transaction(() => {
      const duplicate = this.db
        .select()
        .from(collectionActions)
        .where(eq(collectionActions.actionId, command.actionId))
        .get()
      if (duplicate) {
        if (
          duplicate.userId !== command.userId ||
          duplicate.subjectId !== command.subjectId ||
          JSON.stringify(duplicate.command) !== JSON.stringify(command)
        )
          throw new Error('操作标识重复')
        return this.get(command.userId, command.subjectId)!
      }
      const record = this.ensure(command.userId, command.subjectId, command.subject)
      if (command.kind === 'episodes' && !record.local.collection)
        throw new Error('请先收藏这个条目，再修改章节')
      const retained = record.local.collection ?? record.retained
      const action = this.db
        .insert(collectionActions)
        .values({
          actionId: command.actionId,
          userId: command.userId,
          subjectId: command.subjectId,
          command,
          before: record.local,
          baseRevision: record.revision,
          createdAt: Date.now(),
        })
        .returning({ sequence: collectionActions.sequence })
        .get()
      const next: LocalCollectionRecord = {
        ...record,
        local: applyCommand(record.local, command, retained),
        retained,
        subject: command.subject ?? record.subject,
        revision: action.sequence,
        status: 'pending',
        conflict: null,
        error: null,
        updatedAt: Date.now(),
      }
      this.put(next)
      return next
    })
  }
  cacheRemote(subjectId: number, remote: RemoteCollection) {
    for (const episode of remote.episodes) {
      this.db
        .insert(collectionEpisodes)
        .values({ subjectId, episodeId: episode.id, data: episode })
        .onConflictDoUpdate({
          target: collectionEpisodes.episodeId,
          set: { subjectId, data: episode },
        })
        .run()
    }
  }
  acknowledge(userId: number, subjectId: number, revision: number, remote: RemoteCollection) {
    return this.transaction(() => {
      const current = this.ensure(userId, subjectId, remote.subject)
      this.cacheRemote(subjectId, remote)
      this.db
        .update(collectionActions)
        .set({ acknowledgedAt: Date.now() })
        .where(
          and(
            eq(collectionActions.userId, userId),
            eq(collectionActions.subjectId, subjectId),
            lte(collectionActions.sequence, revision),
            isNull(collectionActions.acknowledgedAt),
          ),
        )
        .run()
      const remaining = this.actions(userId, subjectId)
      let local = structuredClone(remote.snapshot)
      let retained = remote.snapshot.collection ?? current.retained
      // A successful delete need not erase the user's local episode backup.
      if (remote.snapshot.collection === null) local.episodes = { ...current.local.episodes }
      for (const action of remaining) {
        retained = local.collection ?? retained
        local = applyCommand(local, action.command, retained)
      }
      this.put({
        ...current,
        base: remote.snapshot,
        local,
        retained,
        subject: remote.subject ?? current.subject,
        epStatus: remote.epStatus,
        volStatus: remote.volStatus,
        status: remaining.length ? 'pending' : 'clean',
        conflict: null,
        attempt: null,
        error: null,
        syncedAt: Date.now(),
      })
      return this.get(userId, subjectId)!
    })
  }
  seed(userId: number, collection: CollectionData) {
    this.transaction(() => {
      const record = this.ensure(userId, collection.subject_id, collection.subject)
      const fields = {
        type: collection.type,
        rate: collection.rate,
        tags: collection.tags,
        comment: collection.comment,
        private: collection.private,
      }
      const clean =
        !this.actions(userId, record.subjectId).length && !record.attempt && !record.conflict
      this.put({
        ...record,
        subject: collection.subject,
        ...(clean
          ? {
              base: { ...record.base, collection: fields },
              local: { ...record.local, collection: fields },
              retained: fields,
              epStatus: collection.ep_status,
              volStatus: collection.vol_status,
              updatedAt: Date.parse(collection.updated_at) || Date.now(),
            }
          : {}),
      })
    })
  }
  collection(userId: number, subjectId: number): CollectionData | null {
    const record = this.get(userId, subjectId)
    return record ? toCollectionData(record) : null
  }
  list({
    userId,
    subjectType,
    collectionType,
    offset = 0,
    limit = 50,
  }: {
    userId: number
    subjectType?: SubjectType
    collectionType?: number
    offset?: number
    limit?: number
  }): Collections {
    const records = this.all(userId).filter(
      (r) =>
        r.local.collection &&
        (!subjectType || r.subject.type === subjectType) &&
        (!collectionType || r.local.collection.type === collectionType),
    )
    return {
      data: records.slice(offset, offset + limit).map((r) => toCollectionData(r)!),
      total: records.length,
      offset,
      limit,
    }
  }
  episodeResource(episodeId: number) {
    return (
      this.db
        .select()
        .from(collectionEpisodes)
        .where(eq(collectionEpisodes.episodeId, episodeId))
        .get()?.data ?? null
    )
  }
  episodes({
    userId,
    subjectId,
    offset = 0,
    limit = 100,
    episodeType,
  }: {
    userId: number
    subjectId: number
    offset?: number
    limit?: number
    episodeType?: number
  }): CollectionEpisodes {
    const record = this.get(userId, subjectId)
    const resources = this.db
      .select()
      .from(collectionEpisodes)
      .where(eq(collectionEpisodes.subjectId, subjectId))
      .all()
      .filter(
        (r) =>
          (episodeType === undefined || r.data.type === episodeType) &&
          record?.local.episodes[r.episodeId] !== undefined,
      )
      .sort(
        (a, b) =>
          a.data.type - b.data.type || a.data.sort - b.data.sort || a.episodeId - b.episodeId,
      )
    return {
      data: resources
        .slice(offset, offset + limit)
        .map((r) => ({ episode: r.data, type: record!.local.episodes[r.episodeId] })),
      total: resources.length,
      offset,
      limit,
    }
  }
}
function toCollectionData(record: LocalCollectionRecord): CollectionData | null {
  if (!record.local.collection) return null
  const delta = Object.entries(record.local.episodes).reduce(
    // Bangumi's ep_status counts all marked episodes, including wish and dropped.
    (sum, [id, state]) => sum + Number(state !== 0) - Number(!!record.base.episodes[id]),
    0,
  )
  return {
    ...record.local.collection,
    subject: record.subject,
    subject_id: record.subjectId,
    subject_type: record.subject.type,
    updated_at: new Date(record.updatedAt).toISOString(),
    ep_status: Math.max(0, record.epStatus + delta),
    vol_status: record.volStatus,
  }
}
function validateCommand(command: CollectionCommand) {
  if (
    !Number.isSafeInteger(command.userId) ||
    command.userId <= 0 ||
    !Number.isSafeInteger(command.subjectId) ||
    command.subjectId <= 0 ||
    !command.actionId
  )
    throw new Error('无效的账号或条目')
  if (command.kind === 'edit') {
    const { type, rate, tags, comment, private: privacy } = command.patch
    if (type !== undefined && ![1, 2, 3, 4, 5].includes(type)) throw new Error('无效的收藏状态')
    if (rate !== undefined && (!Number.isInteger(rate) || rate < 0 || rate > 10))
      throw new Error('无效的评分')
    if (
      tags !== undefined &&
      (!Array.isArray(tags) || tags.length > 10 || tags.some((t) => typeof t !== 'string'))
    )
      throw new Error('无效的标签')
    if (comment != null && (typeof comment !== 'string' || comment.length > 380))
      throw new Error('短评不能超过 380 字')
    if (privacy !== undefined && typeof privacy !== 'boolean') throw new Error('无效的私密设置')
  }
  if (
    command.kind === 'episodes' &&
    Object.entries(command.episodes).some(
      ([id, state]) =>
        !Number.isSafeInteger(Number(id)) || Number(id) <= 0 || ![0, 1, 2, 3].includes(state),
    )
  )
    throw new Error('无效的章节状态')
}
