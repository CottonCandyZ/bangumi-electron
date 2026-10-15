import type { CollectionRepository } from './repository'
import { CollectionSyncEngine, SyncError, type CollectionTransport } from './sync'
import { CollectionSyncProgress } from './progress'
import type { createCollectionTransport as TransportFactory } from './transport'
import type {
  CollectionChange,
  CollectionReadPriority,
  ConflictResolution,
  SyncOverview,
} from '../../shared/collection-sync'
import { CollectionNotifications } from './notifications'

const listRefreshInterval = 5 * 60 * 1000

export function createCollectionService(
  collectionRepository: CollectionRepository,
  createCollectionTransport: typeof TransportFactory,
  emitChange: (change: CollectionChange) => void,
  emitProgress: (userId: number, overview: SyncOverview) => void,
) {
  const notifications = new CollectionNotifications(emitChange, (id) =>
    emitProgress(id, collectionOverview(id)),
  )
  function notifyCollections(id: number, subjectIds: number[] | null, immediate = false) {
    notifications.collections(id, subjectIds, immediate)
  }
  function notifySyncProgress() {
    if (userId) notifications.progress(userId)
  }
  const engine = new CollectionSyncEngine(collectionRepository, (id, subjectId, changed) => {
    if (changed) notifyCollections(id, [subjectId])
    if (id === userId) notifySyncProgress()
  })
  let userId: number | null = null
  let controller = new AbortController()
  let running: Promise<void> | null = null
  let runningUserId: number | null = null
  let foregroundRunning: Promise<void> | null = null
  let foregroundUserId: number | null = null
  let progress: CollectionSyncProgress | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let failures = 0
  let networkRetryAt = 0
  let pausedForAuth = false
  let lastError: string | null = null
  const requested = new Set<number>()
  const foregroundRequested = new Set<number>()
  const pageReads = new Map<string, Promise<Awaited<ReturnType<CollectionTransport['list']>>>>()
  const pageRefreshedAt = new Map<string, number>()
  let scanRequested = 0

  function activateCollections(id: number | null) {
    if (userId === id) return
    controller.abort()
    controller = new AbortController()
    userId = id
    requested.clear()
    foregroundRequested.clear()
    pageReads.clear()
    pageRefreshedAt.clear()
    scanRequested = 0
    failures = 0
    networkRetryAt = 0
    pausedForAuth = false
    lastError = null
    progress = null
    notifySyncProgress()
    if (timer) clearTimeout(timer)
    if (id) scheduleCollections(500)
  }
  function requestCollection(
    subjectId: number,
    id: number,
    priority: CollectionReadPriority = 'background',
  ) {
    if (id !== userId) return
    const record = collectionRepository.get(id, subjectId)
    if (record?.syncedAt && Date.now() - record.syncedAt < 300000) return
    if (
      record?.status === 'conflict' ||
      record?.status === 'error' ||
      record?.status === 'auth-required'
    )
      return
    if (foregroundRequested.has(subjectId) || engine.isSyncing(id, subjectId)) return
    requested.add(subjectId)
    if (priority === 'foreground') {
      foregroundRequested.add(subjectId)
      void runForegroundCollections()
    }
    scheduleCollections(300)
  }
  function scheduleCollections(delay = 500) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(
      () => {
        timer = undefined
        void runCollections().catch(() => {})
      },
      Math.max(delay, networkRetryAt - Date.now()),
    )
    timer.unref()
  }
  function syncCollections(id: number, full = false) {
    if (userId !== id) throw new Error('当前账号已改变')
    collectionRepository.resetErrors(id)
    if (full) scanRequested += 1
    failures = 0
    networkRetryAt = 0
    pausedForAuth = false
    pageRefreshedAt.clear()
    notifyCollections(id, null)
    scheduleCollections(0)
  }
  async function collectionCredentialsChanged(id: number) {
    if (userId !== id) return
    // Let any transport holding the old token finish before clearing its auth error.
    await Promise.allSettled([running, foregroundRunning, ...pageReads.values()])
    if (userId !== id) return
    collectionRepository.resetErrors(id, true)
    pausedForAuth = false
    failures = 0
    networkRetryAt = 0
    lastError = null
    pageRefreshedAt.clear()
    notifyCollections(id, null)
    scheduleCollections(0)
  }
  function pauseForNetwork(error: SyncError) {
    lastError = error.message
    // Concurrent reads share one cooldown; ordinary reads/edits cannot shorten it.
    if (networkRetryAt <= Date.now()) {
      failures += 1
      networkRetryAt = Date.now() + Math.min(300000, 5000 * 2 ** Math.min(failures, 6))
    }
    notifySyncProgress()
  }
  function throwIfSyncPaused() {
    if (pausedForAuth) throw new SyncError(lastError ?? '请登录后同步', 'auth-required')
    if (networkRetryAt > Date.now())
      throw new SyncError(lastError ?? '连接暂不可用，同步稍后重试', 'network')
  }
  function handleSyncError(error: unknown, signal: AbortSignal) {
    if (signal.aborted) return
    lastError = error instanceof Error ? error.message : '同步失败'
    if (error instanceof SyncError && error.kind === 'network') pauseForNetwork(error)
    else failures += 1
    if (error instanceof SyncError && error.kind === 'auth-required') pausedForAuth = true
    notifySyncProgress()
  }
  function runForegroundCollections() {
    if (foregroundRunning || !userId || pausedForAuth || networkRetryAt > Date.now()) return
    if (!foregroundRequested.size) return
    const id = userId
    const signal = controller.signal
    const subjectId = foregroundRequested.values().next().value!
    foregroundUserId = id
    foregroundRunning = (async () => {
      const transport = createCollectionTransport(id, signal, (profile) =>
        collectionRepository.saveAccount(profile),
      )
      try {
        // One foreground subject may run alongside the serial sidebar/full-sync pass.
        // The engine still shares in-flight work for the same account and subject.
        await syncSubjects(id, [subjectId], transport, signal)
        signal.throwIfAborted()
        foregroundRequested.delete(subjectId)
        if (!pausedForAuth && networkRetryAt <= Date.now()) {
          failures = 0
          networkRetryAt = 0
          lastError = null
        }
      } catch (error) {
        handleSyncError(error, signal)
      } finally {
        transport.dispose?.()
      }
    })().finally(() => {
      foregroundRunning = null
      foregroundUserId = null
      notifySyncProgress()
      if (userId && !pausedForAuth) {
        runForegroundCollections()
        scheduleCollections(0)
      }
    })
    notifySyncProgress()
  }
  async function runCollections() {
    if (running) return running
    if (!userId || pausedForAuth) return
    if (networkRetryAt > Date.now()) {
      scheduleCollections(0)
      return
    }
    const id = userId
    const signal = controller.signal
    runForegroundCollections()
    runningUserId = id
    let activity: CollectionSyncProgress | null = null
    running = (async () => {
      const transport = createCollectionTransport(id, signal, (profile) =>
        collectionRepository.saveAccount(profile),
      )
      try {
        // Process pending edits first. Conflicts only block their own subject.
        const ids = new Set(
          [...requested, ...collectionRepository.pendingSubjectIds(id)].filter(
            (subjectId) => !foregroundRequested.has(subjectId),
          ),
        )
        if (!ids.size && !scanRequested) return
        lastError = null
        activity = new CollectionSyncProgress(() => {
          if (!signal.aborted && userId === id) notifySyncProgress()
        })
        progress = activity
        activity.stage('changes', ids.size)
        await syncSubjects(id, ids, transport, signal, activity)
        // Only an explicit full-sync request may download the complete account list.
        if (scanRequested) {
          const scanRequests = scanRequested
          activity.stage('list', null)
          let offset = 0
          let total = Infinity
          const seen = new Set<number>()
          while (offset < total) {
            throwIfSyncPaused()
            const page = await transport.list(offset)
            total = page.total
            signal.throwIfAborted()
            for (const collection of page.data) seen.add(collection.subject_id)
            const changed = collectionRepository.seedPage(id, page.data)
            if (changed.length) notifyCollections(id, changed)
            offset += page.data.length
            activity.downloaded(offset, total)
            if (offset >= page.total) break
            if (!page.data.length) throw new SyncError('收藏清单未完整返回，请稍后重试', 'network')
          }
          // Missing list items are only candidates. Check them individually before accepting removal.
          const inspect = collectionRepository.inspectSubjectIds(id, seen)
          activity.stage('episodes', inspect.length)
          await syncSubjects(id, inspect, transport, signal, activity)
          signal.throwIfAborted()
          collectionRepository.completeList(id)
          notifyCollections(id, null)
          // Keep failed scans and requests made during this scan eligible for retry.
          scanRequested -= scanRequests
        }
        throwIfSyncPaused()
        failures = 0
        networkRetryAt = 0
        pausedForAuth = false
      } catch (error) {
        handleSyncError(error, signal)
      } finally {
        transport.dispose?.()
      }
    })().finally(() => {
      running = null
      runningUserId = null
      activity?.finish()
      notifySyncProgress()
      if (!userId) return
      if (signal.aborted) {
        scheduleCollections()
        return
      }
      if (pausedForAuth) return
      const pending = collectionRepository.hasPending(id)
      if (requested.size || scanRequested || pending) {
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
    activity?: CollectionSyncProgress,
  ) {
    const startedAt = Date.now()
    for (const subjectId of subjects) {
      signal.throwIfAborted()
      throwIfSyncPaused()
      const current = collectionRepository.get(id, subjectId)
      // A queued sidebar item may already have finished in the foreground lane.
      if (
        !requested.has(subjectId) &&
        !foregroundRequested.has(subjectId) &&
        current?.status === 'clean' &&
        current.syncedAt != null &&
        current.syncedAt >= startedAt
      ) {
        activity?.settled(current, false)
        continue
      }
      // Leave later requests queued if this subject aborts the serial pass.
      requested.delete(subjectId)
      let failed = false
      try {
        await engine.sync(id, subjectId, transport, (phase) => {
          if (!signal.aborted) activity?.subject(collectionRepository.get(id, subjectId)!, phase)
        })
      } catch (error) {
        failed = true
        if (error instanceof SyncError && ['network', 'auth-required'].includes(error.kind)) {
          // Retry the failed request first, rather than probing every remaining subject.
          const remaining = [...requested]
          requested.clear()
          requested.add(subjectId)
          for (const pendingId of remaining) requested.add(pendingId)
          throw error
        }
      } finally {
        if (!signal.aborted) activity?.settled(collectionRepository.get(id, subjectId)!, failed)
      }
    }
  }
  function collectionOverview(id: number): SyncOverview {
    const account = collectionRepository.account(id)
    return {
      ...collectionRepository.overview(id),
      running: userId === id && (runningUserId === id || foregroundUserId === id),
      lastSyncedAt: account?.lastSyncedAt ?? null,
      listComplete: account?.listComplete ?? false,
      error: userId === id ? lastError : null,
      authRequired: userId === id && pausedForAuth,
      retryAt: userId === id && networkRetryAt > Date.now() ? networkRetryAt : null,
      progress:
        userId === id && (runningUserId === id || foregroundUserId !== id)
          ? (progress?.value ?? null)
          : null,
    }
  }

  async function readCollectionPage(
    input: Parameters<typeof collectionRepository.list>[0] & { online?: boolean },
  ) {
    const cached = collectionRepository.list(input)
    if (!input.online) return cached
    if (userId !== input.userId) throw new Error('当前账号已改变')
    const complete = collectionRepository.account(input.userId)?.listComplete
    if (pausedForAuth || networkRetryAt > Date.now()) {
      if (complete || cached.data.length) return cached
      throwIfSyncPaused()
    }
    const signal = controller.signal
    const offset = input.offset ?? 0
    const limit = Math.min(50, Math.max(1, input.limit ?? 50))
    const key = JSON.stringify([
      input.userId,
      input.subjectType,
      input.collectionType,
      offset,
      limit,
    ])
    if (complete && Date.now() - (pageRefreshedAt.get(key) ?? -Infinity) < listRefreshInterval)
      return cached
    let read = pageReads.get(key)
    if (!read) {
      const startedAt = Date.now()
      const refresh = refreshCollectionPage(input, offset, limit, signal).then((page) => {
        signal.throwIfAborted()
        pageRefreshedAt.set(key, startedAt)
        return page
      })
      read = refresh.finally(() => {
        if (pageReads.get(key) === read) pageReads.delete(key)
      })
      pageReads.set(key, read)
    }
    // Full coverage says which records are cached, not whether the website has changed.
    // Keep that cache immediately readable while refreshing just the visible list page.
    if (complete) {
      void read.catch(() => {})
      return cached
    }
    try {
      const page = await read
      // Preserve pending edits/removals when an older server page arrives.
      const data = page.data.flatMap((item) => {
        const local = collectionRepository.collection(input.userId, item.subject_id)
        return local && (!input.collectionType || local.type === input.collectionType)
          ? [local]
          : []
      })
      return { ...page, data, offset, limit }
    } catch (error) {
      signal.throwIfAborted()
      if (cached.data.length) return cached
      throw error
    }
  }
  async function refreshCollectionPage(
    input: Parameters<typeof collectionRepository.list>[0],
    offset: number,
    limit: number,
    signal: AbortSignal,
  ) {
    const transport = createCollectionTransport(input.userId, signal, (profile) =>
      collectionRepository.saveAccount(profile),
    )
    try {
      const page = await transport.list(offset, { ...input, limit })
      signal.throwIfAborted()
      if (userId !== input.userId) throw new Error('当前账号已改变')
      const changed = collectionRepository.seedPage(input.userId, page.data)
      if (changed.length) notifyCollections(input.userId, changed)
      return page
    } catch (error) {
      signal.throwIfAborted()
      if (userId === input.userId && error instanceof SyncError) {
        handleSyncError(error, signal)
        scheduleCollections(0)
      }
      throw error
    } finally {
      transport.dispose?.()
    }
  }
  async function resolveCollection(input: ConflictResolution) {
    if (input.userId !== userId) throw new Error('当前账号已改变')
    const transport = createCollectionTransport(input.userId, controller.signal)
    try {
      await engine.resolve(input, transport)
    } finally {
      transport.dispose?.()
    }
    scheduleCollections(0)
  }

  return {
    activateCollections,
    collectionCredentialsChanged,
    collectionOverview,
    readCollectionPage,
    requestCollection,
    resolveCollection,
    scheduleCollections,
    syncCollections,
    notifyCollections,
    dispose() {
      controller.abort()
      if (timer) clearTimeout(timer)
      notifications.dispose()
    },
  }
}
