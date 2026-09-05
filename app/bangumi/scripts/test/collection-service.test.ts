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
