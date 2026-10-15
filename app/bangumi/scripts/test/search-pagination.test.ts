import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createStore, Provider } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { searchV0 } from '../../src/renderer/src/data/fetch/api/serach'
import { useInfinityQuerySearch } from '../../src/renderer/src/data/hooks/api/search'
import { userIdAtom } from '../../src/renderer/src/state/session'

const mocks = vi.hoisted(() => ({ api: vi.fn() }))
vi.mock('@renderer/data/fetch/config/', () => ({
  SEARCH: { V0: (category: string) => `/v0/search/${category}` },
  apiFetchWithOptionalAuth: mocks.api,
}))

let queryClient: QueryClient
let store: ReturnType<typeof createStore>

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  store = createStore()
  store.set(userIdAtom, null)
})

afterEach(() => {
  queryClient.clear()
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

test.each(['subjects', 'characters', 'persons'] as const)(
  '%s search preserves the server pagination when its limit is smaller than requested',
  async (category) => {
    mocks.api.mockResolvedValue({ total: 115, limit: 20, offset: 20, data: [{ id: 21 }] })

    expect(await searchV0({ limit: 30, offset: 30, searchParam: { category } })).toEqual({
      total: 115,
      limit: 20,
      offset: 20,
      data: [{ id: 21 }],
    })
    expect(mocks.api).toHaveBeenCalledWith(`/v0/search/${category}`, {
      method: 'POST',
      query: { limit: 30, offset: 30 },
      body:
        category === 'subjects' ? { keyword: '', sort: undefined, filter: {} } : { keyword: '' },
    })
  },
)

test('a sidebar requesting 30 items loads all 115 results when the server returns pages of 20', async () => {
  mocks.api.mockImplementation(async (_, { query: { offset } }) => ({
    total: 115,
    limit: 20,
    offset,
    data: Array.from({ length: Math.min(20, 115 - offset) }, (_, index) => ({
      id: offset + index + 1,
    })),
  }))
  const useSearch = () =>
    useInfinityQuerySearch({
      searchParam: { sort: 'heat', filter: { tag: ['2026年10月'] } },
      limit: 30,
    })
  let query = readHook(useSearch)
  await query.refetch()
  query = readHook(useSearch)
  for (let page = 0; query.hasNextPage && page < 6; page++) {
    await query.fetchNextPage()
    query = readHook(useSearch)
  }

  expect(query.hasNextPage).toBe(false)
  expect(query.data?.pages.flatMap((page) => page.data.map((item) => item.id))).toEqual(
    Array.from({ length: 115 }, (_, index) => index + 1),
  )
  expect(mocks.api.mock.calls.map(([, options]) => options.query.offset)).toEqual([
    0, 20, 40, 60, 80, 100,
  ])
})

test('search falls back to requested pagination when a response omits it', async () => {
  mocks.api.mockResolvedValue({ total: 1, data: [{ id: 42 }] })
  expect(await searchV0({ offset: 0, searchParam: {} })).toEqual({
    total: 1,
    limit: 20,
    offset: 0,
    data: [{ id: 42 }],
  })
  expect(await searchV0({ limit: 9, offset: 18, searchParam: {} })).toEqual({
    total: 1,
    limit: 9,
    offset: 18,
    data: [{ id: 42 }],
  })
})
