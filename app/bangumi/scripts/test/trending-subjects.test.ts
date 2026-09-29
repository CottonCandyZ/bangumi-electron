import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createStore, Provider } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { getTrendingSubjects } from '../../src/renderer/src/data/fetch/api/trending'
import {
  useTopListQuery,
  useTrendsInfiniteQuery,
} from '../../src/renderer/src/data/hooks/trending-subjects'
import { restoreQueriesAfterWebVerification } from '../../src/renderer/src/data/hooks/web-verification-cache'
import {
  markWebVerificationComplete,
  markWebVerificationRequired,
} from '../../src/renderer/src/data/fetch/config/web-access'
import { userIdAtom } from '../../src/renderer/src/state/session'

const mocks = vi.hoisted(() => ({ api: vi.fn(), web: vi.fn() }))
vi.mock('@renderer/data/fetch/config', () => ({
  NEXT_SUBJECTS: { TRENDS: '/p1/trending/subjects' },
  nextFetchWithOptionalAuth: mocks.api,
  webFetch: mocks.web,
}))

let queryClient: QueryClient
let store: ReturnType<typeof createStore>

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', { onLine: true })
  markWebVerificationComplete()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  store = createStore()
  store.set(userIdAtom, null)
})

afterEach(() => {
  queryClient.clear()
  markWebVerificationComplete()
  vi.unstubAllGlobals()
})

function readHook<T>(useHook: () => T): T {
  let result: T
  function Probe() {
    result = useHook()
    return null
  }
  renderToString(
    createElement(
      Provider,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
    ),
  )
  return result!
}

test.each([
  ['book', 1],
  ['anime', 2],
  ['music', 3],
  ['game', 4],
  ['real', 6],
] as const)(
  '%s uses the matching API category and preserves server ranking',
  async (sectionPath, type) => {
    mocks.api.mockResolvedValue({
      total: 2,
      data: [{ subject: { id: 42 } }, { subject: { id: 1 } }],
    })
    const signal = new AbortController().signal
    expect(await getTrendingSubjects({ sectionPath, signal })).toEqual({
      data: [{ SubjectId: '42' }, { SubjectId: '1' }],
      nextOffset: undefined,
    })
    expect(mocks.api).toHaveBeenCalledWith('/p1/trending/subjects', {
      query: { type, limit: 24, offset: 0 },
      signal,
    })
  },
)

test('filtered pages advance by the requested limit and empty pages cannot stall the list', async () => {
  mocks.api
    .mockResolvedValueOnce({ total: 49, data: [{ subject: { id: 10 } }] })
    .mockResolvedValueOnce({ total: 49, data: [] })
    .mockResolvedValueOnce({ total: 49, data: [{ subject: { id: 99 } }] })
  let query = readHook(() => useTrendsInfiniteQuery('game'))
  await query.refetch()
  query = readHook(() => useTrendsInfiniteQuery('game'))
  expect(query.hasNextPage).toBe(true)
  await query.fetchNextPage()
  query = readHook(() => useTrendsInfiniteQuery('game'))
  expect(query.data?.pages).toEqual([[{ SubjectId: '10' }], [{ SubjectId: '99' }]])
  expect(query.hasNextPage).toBe(false)
  expect(mocks.api.mock.calls.map(([, options]) => options.query.offset)).toEqual([0, 24, 48])
})

test('an entirely filtered list stops at its total and returns an empty state', async () => {
  mocks.api.mockResolvedValue({ total: 48, data: [] })
  expect(await getTrendingSubjects({ sectionPath: 'game' })).toEqual({
    data: [],
    nextOffset: undefined,
  })
  expect(mocks.api.mock.calls.map(([, options]) => options.query.offset)).toEqual([0, 24])
})

test('API refresh works while webpage verification is pending and never falls back to HTML', async () => {
  markWebVerificationRequired()
  mocks.api.mockResolvedValue({ total: 1, data: [{ subject: { id: 42 } }] })
  let query = readHook(() => useTopListQuery('anime'))
  await query.refetch()
  expect(readHook(() => useTopListQuery('anime')).data).toEqual([{ SubjectId: '42' }])

  mocks.api.mockRejectedValue(new Error('API unavailable'))
  await query.refetch()
  query = readHook(() => useTopListQuery('anime'))
  expect(query.isError).toBe(true)
  expect(query.data).toEqual([{ SubjectId: '42' }])
  expect(mocks.web).not.toHaveBeenCalled()
})

test('web verification cannot replace API caches and account changes use separate caches', async () => {
  queryClient.setQueryData(['SectionTrendsApiV1', 'anime', null], {
    data: [{ SubjectId: '42' }],
    nextOffset: undefined,
  })
  queryClient.setQueryData(['SectionTrendsApiInfiniteV1', 'anime', null], {
    pages: [{ data: [{ SubjectId: '42' }], nextOffset: undefined }],
    pageParams: [0],
  })
  await restoreQueriesAfterWebVerification(queryClient, { anime: [{ SubjectId: '1' }] })
  expect(readHook(() => useTopListQuery('anime')).data).toEqual([{ SubjectId: '42' }])
  expect(readHook(() => useTrendsInfiniteQuery('anime')).data?.pages).toEqual([
    [{ SubjectId: '42' }],
  ])

  store.set(userIdAtom, 'another-user')
  expect(readHook(() => useTopListQuery('anime')).data).toBeUndefined()
  expect(readHook(() => useTrendsInfiniteQuery('anime')).data).toBeUndefined()
})
