import { afterEach, expect, test, vi } from 'vitest'
import { getEpisodeById } from '../../src/renderer/src/data/fetch/api/episodes'

const mocks = vi.hoisted(() => ({ local: vi.fn(), fetch: vi.fn() }))
vi.mock('@renderer/lib/client', () => ({ client: { collectionEpisodeResource: mocks.local } }))
vi.mock('@renderer/data/fetch/config', () => ({
  apiFetchWithOptionalAuth: mocks.fetch,
  EPISODES: { BY_ID: (id: string) => `/episodes/${id}` },
  nextFetch: vi.fn(),
  NEXT_EPISODES: {},
}))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
test('online episode refresh reads current public details even with a cached resource', async () => {
  vi.stubGlobal('navigator', { onLine: true })
  mocks.local.mockResolvedValue({ id: 42, name: 'old' })
  mocks.fetch.mockResolvedValue({ id: 42, name: 'updated' })
  expect(await getEpisodeById({ episodeId: '42' })).toEqual({ id: 42, name: 'updated' })
  expect(mocks.fetch).toHaveBeenCalledWith('/episodes/42')
  expect(mocks.local).not.toHaveBeenCalled()
})
test('offline episode detail uses its local resource and reports missing data', async () => {
  vi.stubGlobal('navigator', { onLine: false })
  mocks.local.mockResolvedValueOnce({ id: 42, name: 'cached' }).mockResolvedValueOnce(null)
  expect(await getEpisodeById({ episodeId: '42' })).toEqual({ id: 42, name: 'cached' })
  await expect(getEpisodeById({ episodeId: '43' })).rejects.toThrow('尚未缓存')
  expect(mocks.fetch).not.toHaveBeenCalled()
})
