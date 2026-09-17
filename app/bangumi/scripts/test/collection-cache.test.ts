import { expect, test, vi } from 'vitest'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import {
  createCollectionCacheUpdater,
  matchesCollectionChange,
  localCollectionQueryOptions,
} from '../../src/renderer/src/data/collection/cache'
import { CollectionNotifications } from '../../src/main/collection/notifications'

test('local changes target one account and subject, not other users or progress', () => {
  const change = { userId: 1, subjectIds: [42] }
  const key = (root: string, userId = 1, own = true, subjectId = '42') => [
    root,
    String(userId),
    { userId, own, subjectId },
  ]
  expect(matchesCollectionChange(key('collection-subject'), change)).toBe(true)
  expect(matchesCollectionChange(key('collection-subject', 1, false), change)).toBe(false)
  expect(matchesCollectionChange(key('collection-episodes', 2), change)).toBe(false)
  expect(matchesCollectionChange(key('collection-episodes', 1, true, '99'), change)).toBe(false)
  expect(matchesCollectionChange(key('collection-subjects'), change)).toBe(true)
  expect(matchesCollectionChange(['collection-sync', 1], change)).toBe(false)
  expect(matchesCollectionChange(['collection-subjects', 'broadcast-watching', 1], change)).toBe(
    true,
  )
  expect(matchesCollectionChange(['collection-subjects', 'broadcast-watching', 2], change)).toBe(
    false,
  )
  expect(localCollectionQueryOptions.persister).toBeUndefined()
  expect(Number.isFinite(localCollectionQueryOptions.gcTime)).toBe(true)
})

test('a change arriving during a read triggers a trailing refresh without cancelling the read', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const key = ['collection-subject', '1', { userId: 1, own: true, subjectId: '42' }]
  client.setQueryData(key, 'old')
  let finish!: (value: string) => void
  const queryFn = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    .mockResolvedValue('newest')
  const observer = new QueryObserver(client, { queryKey: key, queryFn, staleTime: Infinity })
  const unsubscribe = observer.subscribe(() => {})
  const update = createCollectionCacheUpdater(client)
  const first = update({ userId: 1, subjectIds: [42] })
  update({ userId: 1, subjectIds: [42] })
  update({ userId: 1, subjectIds: [42] })
  expect(queryFn).toHaveBeenCalledTimes(1)
  finish('intermediate')
  await first
  expect(queryFn).toHaveBeenCalledTimes(2)
  expect(client.getQueryData(key)).toBe('newest')
  unsubscribe()
  client.clear()
})

test('sync bursts coalesce while committed local edits notify immediately', () => {
  vi.useFakeTimers()
  const changes = vi.fn(),
    progress = vi.fn()
  const notifications = new CollectionNotifications(changes, progress)
  try {
    for (let id = 1; id <= 100; id++) {
      notifications.collections(1, [id])
      notifications.progress(1)
    }
    vi.advanceTimersByTime(100)
    expect(progress).toHaveBeenCalledTimes(1)
    expect(changes).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(changes).toHaveBeenCalledTimes(1)
    expect(changes.mock.calls[0][0].subjectIds).toHaveLength(100)
    notifications.collections(2, [42], true)
    expect(changes).toHaveBeenLastCalledWith({ userId: 2, subjectIds: [42] })
  } finally {
    notifications.dispose()
    vi.useRealTimers()
  }
})
