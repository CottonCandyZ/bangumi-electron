import { BrowserWindow } from 'electron'
import { sqlite } from '../lib/db'
import { CollectionRepository } from './repository'
import { CollectionSyncEngine, SyncError, type CollectionTransport } from './sync'
import { CollectionSyncProgress } from './progress'
import { createCollectionTransport } from './transport'
import type { ConflictResolution, SyncOverview } from '../../shared/collection-sync'

export const collectionRepository = new CollectionRepository(sqlite)
export function notifyCollections() {
  for (const window of BrowserWindow.getAllWindows())
    if (!window.isDestroyed()) window.webContents.send('collections-changed')
}
const engine = new CollectionSyncEngine(collectionRepository, notifyCollections)
function notifySyncProgress() {
  for (const window of BrowserWindow.getAllWindows())
    if (!window.isDestroyed()) window.webContents.send('collection-sync-progress')
}
let userId: number | null = null
let controller = new AbortController()
let running: Promise<void> | null = null
let runningUserId: number | null = null
let progress: CollectionSyncProgress | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let failures = 0
let pausedForAuth = false
let lastError: string | null = null
const requested = new Set<number>()
let scanRequested = 0

export function activateCollections(id: number | null) {
  if (userId === id) return
  controller.abort()
  controller = new AbortController()
  userId = id
  requested.clear()
  scanRequested = 0
  failures = 0
  pausedForAuth = false
  lastError = null
  progress = null
  notifySyncProgress()
  if (timer) clearTimeout(timer)
  if (id) scheduleCollections(500)
}
export function requestCollection(subjectId: number, id: number) {
  if (id !== userId) return
  const record = collectionRepository.get(id, subjectId)
  if (record?.syncedAt && Date.now() - record.syncedAt < 300000) return
  if (
    record?.status === 'conflict' ||
    record?.status === 'error' ||
    record?.status === 'auth-required'
  )
    return
  requested.add(subjectId)
  scheduleCollections(300)
}
export function scheduleCollections(delay = 500) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = undefined
    void runCollections().catch(() => {})
  }, delay)
  timer.unref()
}
export function syncCollections(id: number, full = false) {
  if (userId !== id) throw new Error('当前账号已改变')
  for (const record of collectionRepository.all(id)) {
    if (record.status === 'error' || record.status === 'auth-required')
      collectionRepository.put({ ...record, status: 'pending', error: null })
  }
  if (full) scanRequested += 1
  failures = 0
  pausedForAuth = false
  scheduleCollections(0)
}
export async function collectionCredentialsChanged(id: number) {
  if (userId !== id) return
  // Let any transport holding the old token finish before clearing its auth error.
  await running?.catch(() => {})
  if (userId !== id) return
  for (const record of collectionRepository.all(id)) {
    if (record.status === 'auth-required')
      collectionRepository.put({ ...record, status: 'pending', error: null })
  }
  pausedForAuth = false
  failures = 0
  scheduleCollections(0)
}
async function runCollections() {
  if (running) return running
  if (!userId || pausedForAuth) return
  const id = userId
  const signal = controller.signal
  runningUserId = id
  let activity: CollectionSyncProgress | null = null
  running = (async () => {
    const transport = createCollectionTransport(id, signal, (profile) =>
      collectionRepository.saveAccount(profile),
    )
    try {
      // Process pending edits first. Conflicts only block their own subject.
      const ids = new Set([
        ...requested,
        ...collectionRepository
          .all(id)
          .filter(
            (r) =>
              r.status !== 'conflict' && (['pending', 'syncing'].includes(r.status) || !!r.attempt),
          )
          .map((r) => r.subjectId),
      ])
      if (!ids.size && !scanRequested && collectionRepository.account(id)?.listComplete) return
      lastError = null
      activity = new CollectionSyncProgress(() => {
        if (!signal.aborted && userId === id) notifySyncProgress()
      })
      progress = activity
      activity.stage('changes', ids.size)
      await syncSubjects(id, ids, transport, signal, activity)
      if (scanRequested || !collectionRepository.account(id)?.listComplete) {
        const scanRequests = scanRequested
        activity.stage('list', null)
        let offset = 0
        let total = Infinity
        const seen = new Set<number>()
        while (offset < total) {
          const page = await transport.list(offset)
          total = page.total
          signal.throwIfAborted()
          for (const collection of page.data) {
            seen.add(collection.subject_id)
            collectionRepository.seed(id, collection)
          }
          notifyCollections()
          offset += page.data.length
          activity.downloaded(offset, total)
          if (offset >= page.total) break
          if (!page.data.length) throw new SyncError('收藏清单未完整返回，请稍后重试', 'network')
        }
        // Missing list items are only candidates. Check them individually before accepting removal.
        const inspect = collectionRepository
          .all(id)
          .filter(
            (r) =>
              r.status !== 'conflict' &&
              (!seen.has(r.subjectId) ||
                r.local.collection?.type === 3 ||
                r.local.episodesComplete),
          )
        activity.stage('episodes', inspect.length)
        await syncSubjects(
          id,
          inspect.map((record) => record.subjectId),
          transport,
          signal,
          activity,
        )
        signal.throwIfAborted()
        collectionRepository.completeList(id)
        // Keep failed scans and requests made during this scan eligible for retry.
        scanRequested -= scanRequests
      }
      failures = 0
      pausedForAuth = false
    } catch (error) {
      if (!signal.aborted) {
        lastError = error instanceof Error ? error.message : '同步失败'
        failures += 1
        pausedForAuth = error instanceof SyncError && error.kind === 'auth-required'
      }
    }
  })().finally(() => {
    running = null
    runningUserId = null
    activity?.finish()
    notifyCollections()
    if (!userId) return
    if (signal.aborted) {
      scheduleCollections()
      return
    }
    if (pausedForAuth) return
    const pending = collectionRepository
      .all(id)
      .some((r) => ['pending', 'syncing'].includes(r.status))
    if (
      requested.size ||
      scanRequested ||
      pending ||
      (!collectionRepository.account(id)?.listComplete && failures)
    ) {
      scheduleCollections(failures ? Math.min(300000, 5000 * 2 ** Math.min(failures, 6)) : 1000)
    }
  })
  return running
}

async function syncSubjects(
  id: number,
  subjects: Iterable<number>,
  transport: CollectionTransport,
  signal: AbortSignal,
  activity: CollectionSyncProgress,
) {
  for (const subjectId of subjects) {
    signal.throwIfAborted()
    // Leave later requests queued if this subject aborts the serial pass.
    requested.delete(subjectId)
    let failed = false
    try {
      await engine.sync(id, subjectId, transport, (phase) => {
        if (!signal.aborted) activity.subject(collectionRepository.get(id, subjectId)!, phase)
      })
    } catch (error) {
      failed = true
      if (error instanceof SyncError && ['network', 'auth-required'].includes(error.kind))
        throw error
    } finally {
      if (!signal.aborted) activity.settled(collectionRepository.get(id, subjectId)!, failed)
    }
  }
}
export function collectionOverview(id: number): SyncOverview {
  const records = collectionRepository.all(id)
  const account = collectionRepository.account(id)
  return {
    pending: records.filter(
      (r) =>
        ['pending', 'syncing'].includes(r.status) &&
        collectionRepository.actions(id, r.subjectId).length > 0,
    ).length,
    conflicts: records.filter((r) => r.status === 'conflict'),
    errors: records.filter((r) => r.status === 'error' || r.status === 'auth-required'),
    running: userId === id && runningUserId === id,
    lastSyncedAt: account?.lastSyncedAt ?? null,
    listComplete: account?.listComplete ?? false,
    error: userId === id ? lastError : null,
    authRequired: userId === id && pausedForAuth,
    progress: userId === id ? (progress?.value ?? null) : null,
  }
}
export async function resolveCollection(input: ConflictResolution) {
  if (input.userId !== userId) throw new Error('当前账号已改变')
  await engine.resolve(input, createCollectionTransport(input.userId, controller.signal))
  scheduleCollections(0)
}
