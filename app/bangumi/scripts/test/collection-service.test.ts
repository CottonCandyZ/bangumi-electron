import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createCollectionService } from '../../src/main/collection/service-core'
import type { CollectionRepository } from '../../src/main/collection/repository'
import { SyncError } from '../../src/main/collection/sync'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  sync: vi.fn(),
  changed: vi.fn(),
  repository: {
    all: vi.fn(),
    account: vi.fn(),
    completeList: vi.fn(),
    seedPage: vi.fn(),
    resetErrors: vi.fn(),
    pendingSubjectIds: vi.fn(),
    inspectSubjectIds: vi.fn(),
    hasPending: vi.fn(),
    overview: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    collection: vi.fn(),
  },
}))
vi.mock('../../src/main/collection/sync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/main/collection/sync')>()),
  CollectionSyncEngine: class {
    sync = mocks.sync
    isSyncing = () => false
  },
}))
let service: ReturnType<typeof createCollectionService>
beforeEach(async () => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.useFakeTimers()
  mocks.repository.all.mockReturnValue([])
  mocks.repository.account.mockReturnValue({ listComplete: true })
  mocks.list.mockResolvedValue({ data: [], total: 0 })
  mocks.repository.seedPage.mockImplementation((_id, items) => items.map((item) => item.subject_id))
  mocks.repository.pendingSubjectIds.mockImplementation(() =>
    mocks.repository
      .all()
      .filter(
        (r) => r.status !== 'conflict' && (['pending', 'syncing'].includes(r.status) || r.attempt),
      )
      .map((r) => r.subjectId),
  )
  mocks.repository.hasPending.mockImplementation(() =>
    mocks.repository.all().some((r) => ['pending', 'syncing'].includes(r.status)),
  )
  mocks.repository.inspectSubjectIds.mockImplementation((_id, seen) =>
    mocks.repository
      .all()
      .filter(
        (r) =>
          r.status !== 'conflict' &&
          (!seen.has(r.subjectId) || r.local.collection?.type === 3 || r.local.episodesComplete),
      )
      .map((r) => r.subjectId),
  )
  mocks.repository.overview.mockReturnValue({ pending: 0, conflicts: [], errors: [] })
  service = createCollectionService(
    mocks.repository as unknown as CollectionRepository,
    () => ({ list: mocks.list, read: vi.fn(), write: vi.fn() }),
    mocks.changed,
    vi.fn(),
  )
  service.activateCollections(1)
})
afterEach(() => {
  service.dispose()
  vi.clearAllTimers()
  vi.useRealTimers()
})

test('an incomplete library fetches only the requested page and preserves local edits', async () => {
  mocks.repository.account.mockReturnValue({ listComplete: false })
  mocks.repository.list.mockReturnValue({ data: [], total: 0, offset: 50, limit: 10 })
  mocks.list.mockResolvedValue({
    data: [{ subject_id: 42 }, { subject_id: 43 }],
    total: 200,
    limit: 10,
  })
  mocks.repository.collection.mockImplementation((_id, subject) =>
    subject === 42 ? { subject_id: 42, type: 3, rate: 9 } : null,
  )
  const page = await service.readCollectionPage({
    userId: 1,
    subjectType: 2,
    collectionType: 3,
    offset: 50,
    limit: 10,
    online: true,
  })
  expect(mocks.list).toHaveBeenCalledExactlyOnceWith(
    50,
    expect.objectContaining({ subjectType: 2, collectionType: 3, limit: 10 }),
  )
  expect(page).toEqual({
    data: [{ subject_id: 42, type: 3, rate: 9 }],
    total: 200,
    offset: 50,
    limit: 10,
  })
  expect(mocks.repository.completeList).not.toHaveBeenCalled()
  expect(mocks.sync).not.toHaveBeenCalled()
})

test('partial libraries remain readable offline and on failed requests', async () => {
  const cached = { data: [{ subject_id: 42 }], total: 1, offset: 0, limit: 10 }
  mocks.repository.account.mockReturnValue({ listComplete: false })
  mocks.repository.list.mockReturnValue(cached)
  expect(await service.readCollectionPage({ userId: 1, online: false })).toEqual(cached)
  expect(mocks.list).not.toHaveBeenCalled()
  mocks.list.mockRejectedValue(new SyncError('offline', 'network'))
  expect(await service.readCollectionPage({ userId: 1, online: true })).toEqual(cached)
})

test('a complete library refreshes the visible list and discovers website additions without blocking cached reads', async () => {
  const cached = { data: [{ subject_id: 42 }], total: 1, offset: 0, limit: 10 }
  mocks.repository.list.mockReturnValue(cached)
  let resolve!: (page: unknown) => void
  mocks.list.mockReturnValueOnce(new Promise((done) => (resolve = done)))
  const input = { userId: 1, subjectType: 2 as const, collectionType: 3, limit: 10, online: true }

  expect(await service.readCollectionPage(input)).toEqual(cached)
  expect(await service.readCollectionPage(input)).toEqual(cached)
  expect(mocks.list).toHaveBeenCalledExactlyOnceWith(
    0,
    expect.objectContaining({ subjectType: 2, collectionType: 3, limit: 10 }),
  )
  expect(mocks.repository.seedPage).not.toHaveBeenCalled()
  resolve({ data: [{ subject_id: 43 }, { subject_id: 42 }], total: 2, limit: 10 })
  await vi.advanceTimersByTimeAsync(250)
  expect(mocks.repository.seedPage).toHaveBeenCalledWith(1, [
    { subject_id: 43 },
    { subject_id: 42 },
  ])
  expect(mocks.changed).toHaveBeenCalledWith({ userId: 1, subjectIds: [43, 42] })
  await service.readCollectionPage(input)
  expect(mocks.list).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
  await service.readCollectionPage(input)
  expect(mocks.list).toHaveBeenCalledTimes(2)
  expect(mocks.repository.completeList).not.toHaveBeenCalled()
  expect(mocks.sync).not.toHaveBeenCalled()
})

test('complete list refreshes keep cached local changes readable on network failure', async () => {
  const cached = { data: [{ subject_id: 42, rate: 9 }], total: 1, offset: 0, limit: 10 }
  mocks.repository.list.mockReturnValue(cached)
  mocks.list.mockRejectedValue(new SyncError('offline', 'network'))
  expect(await service.readCollectionPage({ userId: 1, online: true })).toEqual(cached)
  await vi.advanceTimersByTimeAsync(1)
  expect(service.collectionOverview(1).retryAt).toBeGreaterThan(Date.now())
  expect(await service.readCollectionPage({ userId: 1, online: true })).toEqual(cached)
  expect(mocks.list).toHaveBeenCalledTimes(1)
  expect(mocks.repository.seedPage).not.toHaveBeenCalled()
})

test('complete list refreshes are isolated by filter and account activation', async () => {
  mocks.repository.list.mockReturnValue({ data: [], total: 0, offset: 0, limit: 50 })
  await service.readCollectionPage({ userId: 1, collectionType: 3, online: true })
  await service.readCollectionPage({ userId: 1, collectionType: 2, online: true })
  expect(mocks.list).toHaveBeenCalledTimes(2)
  service.activateCollections(2)
  await service.readCollectionPage({ userId: 2, collectionType: 3, online: true })
  expect(mocks.list).toHaveBeenCalledTimes(3)
})

test('a page arriving after account switch cannot seed the previous account', async () => {
  mocks.repository.account.mockReturnValue({ listComplete: false })
  mocks.repository.list.mockReturnValue({ data: [], total: 0, offset: 0, limit: 50 })
  let resolve!: (page: unknown) => void
  mocks.list.mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  const result = service.readCollectionPage({ userId: 1, online: true })
  service.activateCollections(2)
  resolve({ data: [{ subject_id: 42 }], total: 1, limit: 50 })
  await expect(result).rejects.toThrow()
  expect(mocks.repository.seedPage).not.toHaveBeenCalled()
})

test('a failed manual full scan retries even when the previous list was complete', async () => {
  mocks.list.mockRejectedValueOnce(new SyncError('offline', 'network'))
  service.syncCollections(1, true)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.list).toHaveBeenCalledTimes(1)
  expect(mocks.repository.completeList).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(10000)
  expect(mocks.list).toHaveBeenCalledTimes(2)
  expect(mocks.repository.completeList).toHaveBeenCalledTimes(1)
})

test('first activation and reconnect do not start a full scan without user intent', async () => {
  mocks.repository.account.mockReturnValue(null)
  await vi.advanceTimersByTimeAsync(1000)
  service.syncCollections(1)
  await vi.advanceTimersByTimeAsync(10000)
  expect(mocks.list).not.toHaveBeenCalled()
  expect(mocks.repository.completeList).not.toHaveBeenCalled()
  service.syncCollections(1, true)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.list).toHaveBeenCalledTimes(1)
  expect(mocks.repository.completeList).toHaveBeenCalledTimes(1)
})

test('network failures retry pending subjects automatically and manual retry bypasses the delay', async () => {
  const record = { subjectId: 42, subject: { name: 'test' }, status: 'pending', local: {} }
  mocks.repository.all.mockReturnValue([record])
  mocks.repository.get.mockReturnValue(record)
  mocks.sync
    .mockRejectedValueOnce(new SyncError('Bangumi 请求失败（502）', 'network'))
    .mockRejectedValueOnce(new SyncError('Bangumi 请求失败（502）', 'network'))
    .mockImplementation(async () => {
      record.status = 'clean'
    })
  await vi.advanceTimersByTimeAsync(500)
  expect(mocks.sync).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(9999)
  expect(mocks.sync).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.sync).toHaveBeenCalledTimes(2)
  service.syncCollections(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.sync).toHaveBeenCalledTimes(3)
  expect(mocks.repository.resetErrors).toHaveBeenCalledWith(1)
  expect(mocks.list).not.toHaveBeenCalled()
  expect(service.collectionOverview(1).error).toBeNull()
  await vi.advanceTimersByTimeAsync(300000)
  expect(mocks.sync).toHaveBeenCalledTimes(3)
})

test('individual reads and pending edits do not implicitly download the account list', async () => {
  mocks.repository.account.mockReturnValue({ listComplete: false })
  const record = { subjectId: 42, subject: { name: 'test' }, status: 'pending', local: {} }
  mocks.repository.all.mockReturnValue([record])
  mocks.repository.get.mockReturnValue(record)
  mocks.sync.mockImplementation(async () => {
    record.status = 'clean'
  })
  service.requestCollection(43, 1)
  await vi.advanceTimersByTimeAsync(300)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([43, 42])
  expect(mocks.list).not.toHaveBeenCalled()
})

test('unprocessed refresh requests survive an earlier network failure', async () => {
  mocks.repository.get.mockImplementation((_user, subjectId) => ({
    subjectId,
    subject: { name: 'test' },
    status: 'clean',
    local: {},
  }))
  mocks.sync.mockRejectedValueOnce(new SyncError('offline', 'network'))
  service.requestCollection(42, 1)
  service.requestCollection(43, 1)
  await vi.advanceTimersByTimeAsync(300)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42])
  await vi.advanceTimersByTimeAsync(10000)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 42, 43])
})

test('foreground subjects finish while sidebar progress sync is still blocked', async () => {
  mocks.repository.get.mockImplementation((_user, subjectId) => ({
    subjectId,
    subject: { name: 'test' },
    status: 'clean',
    local: {},
  }))
  let unblock!: () => void
  const blocked = new Promise<void>((resolve) => (unblock = resolve))
  mocks.sync.mockImplementation((_user, subjectId) =>
    subjectId === 42 ? blocked : Promise.resolve(),
  )
  service.requestCollection(42, 1)
  service.requestCollection(43, 1)
  await vi.advanceTimersByTimeAsync(300)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42])

  service.requestCollection(44, 1, 'foreground')
  service.requestCollection(44, 1, 'foreground')
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 44])
  expect(service.collectionOverview(1).running).toBe(true)
  unblock()
  await vi.advanceTimersByTimeAsync(1000)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 44, 43])
})

test('foreground reads respect the shared network cooldown and retry automatically', async () => {
  mocks.repository.get.mockImplementation((_user, subjectId) => ({
    subjectId,
    subject: { name: 'test' },
    status: 'clean',
    local: {},
  }))
  mocks.sync.mockRejectedValueOnce(new SyncError('offline', 'network'))
  service.requestCollection(42, 1, 'foreground')
  await vi.advanceTimersByTimeAsync(1)
  service.requestCollection(43, 1, 'foreground')
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42])
  await vi.advanceTimersByTimeAsync(10000)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 42, 43])
  expect(service.collectionOverview(1).retryAt).toBeNull()
  expect(service.collectionOverview(1).error).toBeNull()
})

test('a gateway timeout pauses all subjects and new reads or edits cannot bypass the cooldown', async () => {
  mocks.repository.get.mockImplementation((_user, subjectId) => ({
    subjectId,
    subject: { name: 'test' },
    status: 'clean',
    local: {},
  }))
  mocks.sync.mockRejectedValue(new SyncError('Bangumi 请求失败（504）', 'network'))
  service.requestCollection(42, 1)
  service.requestCollection(43, 1)
  await vi.advanceTimersByTimeAsync(300)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42])
  const retryAt = service.collectionOverview(1).retryAt!
  expect(retryAt).toBe(Date.now() + 10000)
  service.requestCollection(44, 1)
  service.scheduleCollections(0)
  await vi.advanceTimersByTimeAsync(9999)
  expect(mocks.sync).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 42])
  expect(service.collectionOverview(1).retryAt).toBe(Date.now() + 20000)
  mocks.sync.mockResolvedValue(undefined)
  service.syncCollections(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 42, 42, 43, 44])
  expect(service.collectionOverview(1).retryAt).toBeNull()
})

test('collection page timeouts share the sync cooldown and cached pages remain readable', async () => {
  const cached = { data: [{ subject_id: 42 }], total: 1, offset: 0, limit: 10 }
  mocks.repository.account.mockReturnValue({ listComplete: false })
  mocks.repository.list.mockReturnValue(cached)
  mocks.list.mockRejectedValue(new SyncError('Bangumi 请求失败（504）', 'network'))
  expect(await service.readCollectionPage({ userId: 1, online: true })).toEqual(cached)
  expect(await service.readCollectionPage({ userId: 1, online: true })).toEqual(cached)
  expect(mocks.list).toHaveBeenCalledTimes(1)
  mocks.repository.list.mockReturnValue({ ...cached, data: [] })
  await expect(service.readCollectionPage({ userId: 1, online: true })).rejects.toThrow('504')
  expect(mocks.list).toHaveBeenCalledTimes(1)
  service.activateCollections(2)
  expect(service.collectionOverview(2).retryAt).toBeNull()
  await expect(service.readCollectionPage({ userId: 2, online: true })).rejects.toThrow('504')
  expect(mocks.list).toHaveBeenCalledTimes(2)
})

test('web authorization failure does not pause other OAuth-capable subjects', async () => {
  mocks.repository.get.mockImplementation((_user, subjectId) => ({
    subjectId,
    subject: { name: 'test' },
    status: 'clean',
    local: {},
  }))
  mocks.sync.mockRejectedValueOnce(new SyncError('web login required', 'web-auth-required'))
  service.requestCollection(42, 1)
  service.requestCollection(43, 1)
  await vi.advanceTimersByTimeAsync(300)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 43])
  service.requestCollection(44, 1)
  await vi.advanceTimersByTimeAsync(300)
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 43, 44])
})

test('a per-subject failure also keeps the requested full scan pending', async () => {
  const record = { subjectId: 42, subject: { name: 'test' }, status: 'clean', local: {} }
  mocks.repository.all.mockReturnValue([record])
  mocks.repository.get.mockReturnValue(record)
  mocks.sync.mockRejectedValueOnce(new SyncError('offline', 'network'))
  service.syncCollections(1, true)
  await vi.advanceTimersByTimeAsync(1)
  expect(mocks.repository.completeList).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(10000)
  expect(mocks.list).toHaveBeenCalledTimes(2)
  expect(mocks.repository.completeList).toHaveBeenCalledTimes(1)
})

test('a new full scan requested during download survives completion of the current scan', async () => {
  mocks.list.mockImplementationOnce(async () => {
    service.syncCollections(1, true)
    return { data: [], total: 0 }
  })
  service.syncCollections(1, true)
  await vi.advanceTimersByTimeAsync(1)
  await vi.advanceTimersByTimeAsync(1000)
  expect(mocks.list).toHaveBeenCalledTimes(2)
  expect(mocks.repository.completeList).toHaveBeenCalledTimes(2)
})
