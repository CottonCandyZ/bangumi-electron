import { randomUUID } from 'node:crypto'
import type { CollectionRepository } from './repository'
import {
  applyCommand,
  collectionFields,
  equalValue,
  mergeCollection,
  snapshotMatches,
  touchedBy,
  type CollectionSnapshot,
  type ConflictResolution,
  type LocalCollectionRecord,
  type RemoteCollection,
  type CollectionFields,
  type SyncPhase,
} from '../../shared/collection-sync'
import type { CollectionData } from '../../shared/types/collection'

export class SyncError extends Error {
  constructor(
    message: string,
    public kind: 'network' | 'auth-required' | 'error' = 'error',
  ) {
    super(message)
  }
}
export async function retryableNetworkOperation<T>(
  operation: () => Promise<T>,
  message: string,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof SyncError) throw error
    throw new SyncError(message, 'network')
  }
}
export interface CollectionTransport {
  read(subjectId: number): Promise<RemoteCollection>
  write(subjectId: number, before: CollectionSnapshot, target: CollectionSnapshot): Promise<void>
  list(offset: number): Promise<{ data: CollectionData[]; total: number; limit: number }>
}
export class CollectionSyncEngine {
  private active = new Map<string, Promise<void>>()
  constructor(
    private repository: CollectionRepository,
    private changed: () => void = () => {},
  ) {}
  sync(
    userId: number,
    subjectId: number,
    transport: CollectionTransport,
    progress: (phase: SyncPhase) => void = () => {},
  ): Promise<void> {
    const key = `${userId}:${subjectId}`
    const existing = this.active.get(key)
    if (existing) return existing
    const job = this.run(userId, subjectId, transport, progress).finally(() =>
      this.active.delete(key),
    )
    this.active.set(key, job)
    return job
  }
  private async run(
    userId: number,
    subjectId: number,
    transport: CollectionTransport,
    progress: (phase: SyncPhase) => void,
  ) {
    let record = this.repository.ensure(userId, subjectId)
    if (record.status === 'conflict') return
    this.repository.put({ ...record, status: 'syncing', error: null })
    this.changed()
    try {
      progress('reading')
      const remote = await transport.read(subjectId)
      // This record is frozen before the network read. Never acknowledge later actions.
      if (!this.repository.actions(userId, subjectId).length && !record.attempt) {
        this.repository.acknowledge(userId, subjectId, record.revision, remote)
        return
      }
      if (record.attempt && snapshotMatches(record.attempt.target, remote.snapshot)) {
        this.repository.acknowledge(userId, subjectId, record.attempt.revision, remote)
        return
      }
      const plan = this.plan(record, remote.snapshot)
      if (plan.conflicts.length) {
        const current = this.repository.get(userId, subjectId)!
        if (current.revision !== record.revision) {
          this.repository.put({ ...current, status: 'pending' })
          return
        }
        this.repository.put({
          ...current,
          status: 'conflict',
          conflict: { revision: record.revision, remote: remote.snapshot, fields: plan.conflicts },
        })
        return
      }
      const current = this.repository.get(userId, subjectId)!
      const attempt = { revision: record.revision, target: plan.target, remote: remote.snapshot }
      this.repository.put({ ...current, attempt, status: 'syncing' })
      if (!snapshotMatches(plan.target, remote.snapshot)) {
        progress('uploading')
        await transport.write(subjectId, remote.snapshot, plan.target)
      }
      progress('verifying')
      const verified = await transport.read(subjectId)
      if (!snapshotMatches(plan.target, verified.snapshot))
        throw new SyncError('远端状态尚未确认，将重新检查后同步', 'network')
      this.repository.acknowledge(userId, subjectId, record.revision, verified)
    } catch (error) {
      record = this.repository.get(userId, subjectId)!
      const cancelled = error instanceof Error && error.name === 'AbortError'
      this.repository.put({
        ...record,
        status: cancelled
          ? 'pending'
          : error instanceof SyncError && error.kind === 'auth-required'
            ? 'auth-required'
            : error instanceof SyncError && error.kind === 'network'
              ? 'pending'
              : 'error',
        error: cancelled ? null : error instanceof Error ? error.message : '同步失败',
      })
      throw error
    } finally {
      this.changed()
    }
  }
  private plan(record: LocalCollectionRecord, remote: CollectionSnapshot) {
    const actions = this.repository
      .actions(record.userId, record.subjectId)
      .filter((a) => a.sequence <= record.revision)
    let base = record.base
    let local = record.local
    if (record.attempt) {
      const attempt = record.attempt
      base = structuredClone(attempt.remote)
      local = structuredClone(attempt.target)
      for (const action of actions.filter((a) => a.sequence > attempt.revision))
        local = applyCommand(local, action.command, record.retained)
      // A timeout can conceal partial success. Accept only values proven to match our attempt.
      if (remote.collection && base.collection && attempt.target.collection) {
        for (const key of collectionFields) {
          if (equalValue(remote.collection[key], attempt.target.collection[key], key))
            Object.assign(base.collection, { [key]: remote.collection[key] })
        }
      } else if (equalValue(remote.collection, attempt.target.collection))
        base.collection = remote.collection
      for (const [id, state] of Object.entries(attempt.target.episodes)) {
        if (remote.episodes[id] === state) base.episodes[id] = state
      }
    }
    return mergeCollection(base, local, remote, touchedBy(actions))
  }
  async resolve(input: ConflictResolution, transport: CollectionTransport) {
    const record = this.repository.get(input.userId, input.subjectId)
    if (!record?.conflict || record.revision !== input.revision)
      throw new Error('本地状态已改变，请重新查看冲突')
    const remote = await transport.read(input.subjectId)
    const current = this.repository.get(input.userId, input.subjectId)!
    if (current.revision !== input.revision) throw new Error('本地状态已改变，请重新查看冲突')
    if (
      !snapshotMatches(record.conflict.remote, remote.snapshot) ||
      !snapshotMatches(remote.snapshot, record.conflict.remote)
    ) {
      const next = this.plan(current, remote.snapshot)
      this.repository.put({
        ...current,
        status: next.conflicts.length ? 'conflict' : 'pending',
        conflict: next.conflicts.length
          ? { revision: current.revision, remote: remote.snapshot, fields: next.conflicts }
          : null,
      })
      this.changed()
      throw new Error('远端状态已改变，请重新查看差异')
    }
    const plan = this.plan(current, remote.snapshot)
    const target = plan.target
    let preserveRemovalBackup = false
    for (const field of plan.conflicts) {
      const choice = input.choices[field.path]
      if (choice !== 'local' && choice !== 'remote') throw new Error('请为每一项冲突选择保留的版本')
      const value = choice === 'local' ? field.local : field.remote
      if (field.path === 'collection') {
        target.collection = value as CollectionFields | null
        preserveRemovalBackup = choice === 'local' && value === null
        target.episodes = structuredClone(
          choice === 'local' ? current.local.episodes : remote.snapshot.episodes,
        )
      } else if (field.path.startsWith('episodes.')) {
        const id = field.path.slice(9)
        if (value === undefined) delete target.episodes[id]
        else target.episodes[id] = value as 0 | 1 | 2 | 3
      } else Object.assign(target.collection!, { [field.path]: value })
    }
    this.repository.transaction(() => {
      // Resolution is a new durable intent against the freshly checked remote baseline.
      this.repository.acknowledge(input.userId, input.subjectId, current.revision, remote)
      if (target.collection === null) {
        const removed = this.repository.command({
          actionId: randomUUID(),
          userId: input.userId,
          subjectId: input.subjectId,
          kind: 'remove',
        })
        if (preserveRemovalBackup) {
          this.repository.put({
            ...removed,
            retained: current.retained,
            local: {
              ...removed.local,
              episodes: structuredClone(target.episodes),
              episodesComplete: current.local.episodesComplete,
            },
          })
        }
      } else if (target.collection) {
        this.repository.command({
          actionId: randomUUID(),
          userId: input.userId,
          subjectId: input.subjectId,
          kind: 'edit',
          patch: target.collection,
        })
        if (Object.keys(target.episodes).length)
          this.repository.command({
            actionId: randomUUID(),
            userId: input.userId,
            subjectId: input.subjectId,
            kind: 'episodes',
            episodes: target.episodes,
          })
      }
    })
    this.changed()
  }
}
