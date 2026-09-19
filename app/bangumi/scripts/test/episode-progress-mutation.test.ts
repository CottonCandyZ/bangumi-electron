import { beforeEach, expect, test, vi } from 'vitest'
import { CollectionEpisode } from '../../src/shared/types/collection'
import { markLocalEpisodesWatchedThrough } from '../../src/renderer/src/data/collection/client'

const fixture = vi.hoisted(() => ({
  userId: 1,
  read: vi.fn(),
  command: vi.fn(),
}))
vi.mock('@renderer/lib/client', () => ({
  client: { collectionReadEpisodes: fixture.read, collectionCommand: fixture.command },
}))
vi.mock('@renderer/modules/wrapper/query', () => ({ queryClient: {} }))
vi.mock('@renderer/data/collection/cache', () => ({ createCollectionCacheUpdater: () => vi.fn() }))
vi.mock('@renderer/state/utils', () => ({ store: { get: () => fixture.userId } }))
vi.mock('@renderer/state/session', () => ({ userIdAtom: {} }))
vi.mock('@renderer/data/fetch/session', () => ({ getAccessToken: async () => null }))

function episodes(): CollectionEpisode[] {
  return Array.from({ length: 220 }, (_, index) => ({
    type: index === 0 ? 2 : index === 2 ? 3 : 0,
    episode: {
      id: index + 1,
      sort: index + 1,
      ep: index + 1,
      subject_id: 42,
      type: 0,
      name: '',
      name_cn: '',
      desc: '',
      airdate: '',
      duration: '',
      duration_seconds: 0,
      disc: 0,
      comment: 0,
    },
  }))
}
beforeEach(() => {
  fixture.userId = 1
  fixture.read.mockReset().mockResolvedValue({ ready: true, data: episodes() })
  fixture.command.mockReset().mockResolvedValue(undefined)
})

test('commits the complete watched-through range in a single durable command', async () => {
  expect(await markLocalEpisodesWatchedThrough({ subjectId: '42', episodeId: 205 })).toBe(203)
  expect(fixture.command).toHaveBeenCalledTimes(1)
  const command = fixture.command.mock.calls[0][0]
  expect(command).toMatchObject({ userId: 1, subjectId: 42, kind: 'episodes' })
  expect(command.episodes).toMatchObject({ 2: 2, 100: 2, 205: 2 })
  expect(command.episodes[1]).toBeUndefined()
  expect(command.episodes[3]).toBeUndefined()
  expect(command.episodes[206]).toBeUndefined()
})

test('does not write when the snapshot is incomplete or the target disappeared', async () => {
  fixture.read.mockResolvedValueOnce({ ready: false, data: episodes() })
  await expect(
    markLocalEpisodesWatchedThrough({ subjectId: '42', episodeId: 205 }),
  ).rejects.toThrow('尚未加载完成')
  await expect(
    markLocalEpisodesWatchedThrough({ subjectId: '42', episodeId: 999 }),
  ).rejects.toThrow('找不到')
  expect(fixture.command).not.toHaveBeenCalled()
})

test('an account switch while loading cannot write progress into the new account', async () => {
  fixture.read.mockImplementationOnce(async () => {
    fixture.userId = 2
    return { ready: true, data: episodes() }
  })
  await expect(
    markLocalEpisodesWatchedThrough({ subjectId: '42', episodeId: 205 }),
  ).rejects.toThrow('账号已切换')
  expect(fixture.command).not.toHaveBeenCalled()
})

test('repeating a completed range is a no-op, and local write failures propagate', async () => {
  expect(await markLocalEpisodesWatchedThrough({ subjectId: '42', episodeId: 1 })).toBe(0)
  expect(fixture.command).not.toHaveBeenCalled()
  fixture.command.mockRejectedValueOnce(new Error('disk unavailable'))
  await expect(
    markLocalEpisodesWatchedThrough({ subjectId: '42', episodeId: 205 }),
  ).rejects.toThrow('disk unavailable')
  expect(fixture.command).toHaveBeenCalledTimes(1)
})
