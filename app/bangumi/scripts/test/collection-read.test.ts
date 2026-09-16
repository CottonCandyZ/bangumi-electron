import { beforeEach, expect, test, vi } from 'vitest'
import {
  readLocalEpisodes,
  readLocalSubject,
  pendingCollectionInterval,
} from '../../src/renderer/src/data/collection/read'
import { CollectionPendingError } from '../../src/renderer/src/lib/utils/network'

const client = vi.hoisted(() => ({
  collectionRead: vi.fn(),
  collectionReadEpisodes: vi.fn(),
  collectionState: vi.fn(),
}))
vi.mock('@renderer/lib/client', () => ({ client }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('navigator', { onLine: true })
})

test('a missed sync notification can recover the pending collection without logging in again', async () => {
  const input = { userId: 1, subjectId: 42 }
  await expect(readLocalSubject(input)).rejects.toBeInstanceOf(CollectionPendingError)
  expect(pendingCollectionInterval({ state: { error: new CollectionPendingError() } })).toBe(1000)
  client.collectionRead.mockResolvedValue({ subject_id: 42, type: 3 })
  await expect(readLocalSubject(input)).resolves.toMatchObject({ type: 3 })
  expect(pendingCollectionInterval({ state: { error: null } })).toBe(false)
})

test('unloaded episodes stay pending until a complete, possibly empty snapshot arrives', async () => {
  const input = { userId: 1, subjectId: '42', offset: 0, limit: 100, episodeType: undefined }
  client.collectionReadEpisodes.mockResolvedValue({ ready: false, data: [], total: 0 })
  await expect(readLocalEpisodes(input)).rejects.toBeInstanceOf(CollectionPendingError)
  client.collectionReadEpisodes.mockResolvedValue({ ready: true, data: [], total: 0 })
  await expect(readLocalEpisodes(input)).resolves.toMatchObject({ data: [], total: 0 })
})

test('confirmed uncollected state is usable and sync failures stop the skeleton retry loop', async () => {
  const input = { userId: 1, subjectId: 42 }
  client.collectionRead.mockResolvedValueOnce(null)
  await expect(readLocalSubject(input)).resolves.toBeNull()
  client.collectionState.mockResolvedValue({ error: '同步失败' })
  await expect(readLocalSubject(input)).rejects.toThrow('同步失败')
  expect(pendingCollectionInterval({ state: { error: new Error('同步失败') } })).toBe(false)
  vi.stubGlobal('navigator', { onLine: false })
  expect(pendingCollectionInterval({ state: { error: new CollectionPendingError() } })).toBe(false)
})
