import { expect, test } from 'vitest'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { FetchError } from 'ofetch'
import { refreshResourceBatch } from '../../src/renderer/src/data/hooks/resource-refresh'
import { restoreQueriesAfterWebVerification } from '../../src/renderer/src/data/hooks/web-verification-cache'
import {
  markWebVerificationRequired,
  markWebVerificationComplete,
  queueWebTrends,
} from '../../src/renderer/src/data/fetch/config/web-access'
import {
  isNetworkUnavailableError,
  OfflineResourceError,
} from '../../src/renderer/src/lib/utils/network'

test('404 removes cached list items while network failures preserve them', async () => {
  const data = new Map([
    [1, { id: 1 }],
    [2, { id: 2 }],
  ])
  const notFound = new FetchError('not found')
  Object.defineProperty(notFound, 'statusCode', { value: 404 })
  const saved: number[] = []
  await refreshResourceBatch({
    ids: [1, 2, 3],
    data,
    fetch: async (id) => {
      if (id === 1) throw notFound
      if (id === 2) throw new TypeError('Failed to fetch')
      return { id }
    },
    save: async (items) => {
      saved.push(...items.map((item) => item.id))
    },
    publish: () => {},
  })
  expect([...data.keys()]).toEqual([2, 3])
  expect(saved).toEqual([3])
})

test('uncached network failures do not become a successful empty list', async () => {
  const error = new TypeError('Failed to fetch')
  await expect(
    refreshResourceBatch({
      ids: [1],
      data: new Map(),
      fetch: async () => {
        throw error
      },
      save: async () => {},
      publish: () => {},
    }),
  ).rejects.toThrow(error)
})

test('batch reads are sequential and successful items survive a different 404', async () => {
  let active = 0,
    maximum = 0
  const data = new Map<number, { id: number }>()
  await refreshResourceBatch({
    ids: [1, 2, 3],
    data,
    fetch: async (id) => {
      active++
      maximum = Math.max(maximum, active)
      await new Promise((resolve) => setTimeout(resolve, 1))
      active--
      return { id }
    },
    save: async () => {},
    publish: () => {},
  })
  expect(maximum).toBe(1)
  expect(data.size).toBe(3)
})

test('network classification does not silence server errors or programming bugs', () => {
  expect(isNetworkUnavailableError(new OfflineResourceError())).toBe(true)
  expect(isNetworkUnavailableError(new TypeError('Failed to fetch'))).toBe(true)
  expect(isNetworkUnavailableError(new TypeError('cannot read properties of undefined'))).toBe(
    false,
  )
  const server = new FetchError('server failed')
  Object.defineProperty(server, 'statusCode', { value: 500 })
  expect(isNetworkUnavailableError(server)).toBe(false)
})

test('verification refreshes every mounted category serially and leaves inactive queries stale', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const unsubscribes: (() => void)[] = []
  const calls: string[] = []
  let active = 0,
    maximum = 0
  try {
    for (const section of ['anime', 'game', 'book', 'music', 'real']) {
      const queryKey = ['SectionTrendsV2', section]
      client.setQueryData(queryKey, [])
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn: () =>
          queueWebTrends(async () => {
            active++
            maximum = Math.max(maximum, active)
            calls.push(section)
            await new Promise((resolve) => setTimeout(resolve, 1))
            active--
            return [{ SubjectId: '42' }]
          }),
      })
      unsubscribes.push(observer.subscribe(() => {}))
    }
    client.setQueryData(['SectionTrendsInfiniteV2', 'game'], { pages: [[]], pageParams: [1] })
    markWebVerificationRequired()
    await restoreQueriesAfterWebVerification(client, 'anime', [{ SubjectId: '1' }])
    expect(calls).toEqual(['game', 'book', 'music', 'real'])
    expect(maximum).toBe(1)
    expect(client.getQueryData(['SectionTrendsV2', 'anime'])).toEqual([{ SubjectId: '1' }])
    expect(client.getQueryState(['SectionTrendsInfiniteV2', 'game'])?.isInvalidated).toBe(true)
  } finally {
    unsubscribes.forEach((unsubscribe) => unsubscribe())
    client.clear()
    markWebVerificationComplete()
  }
})
