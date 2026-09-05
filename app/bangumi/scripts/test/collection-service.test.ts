import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { SyncError } from '../../src/main/collection/sync'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  sync: vi.fn(),
  repository: {
    all: vi.fn(),
    account: vi.fn(),
    completeList: vi.fn(),
    seed: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    collection: vi.fn(),
  },
}))
vi.mock('electron', () => ({ BrowserWindow: { getAllWindows: () => [] } }))
vi.mock('../../src/main/lib/db', () => ({ sqlite: {} }))
vi.mock('../../src/main/collection/repository', () => ({
  CollectionRepository: class {
    constructor() {
      return mocks.repository
    }
  },
}))
vi.mock('../../src/main/collection/transport', () => ({
  createCollectionTransport: () => ({ list: mocks.list }),
}))
vi.mock('../../src/main/collection/sync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/main/collection/sync')>()),
  CollectionSyncEngine: class {
    sync = mocks.sync
  },
}))
let service: typeof import('../../src/main/collection/service')
beforeEach(async () => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.useFakeTimers()
  mocks.repository.all.mockReturnValue([])
  mocks.repository.account.mockReturnValue({ listComplete: true })
  mocks.list.mockResolvedValue({ data: [], total: 0 })
  service = await import('../../src/main/collection/service')
  service.activateCollections(1)
})
afterEach(() => {
  service.activateCollections(null)
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
  expect(mocks.repository.seed).not.toHaveBeenCalled()
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
  expect(mocks.sync.mock.calls.map((call) => call[1])).toEqual([42, 43])
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
