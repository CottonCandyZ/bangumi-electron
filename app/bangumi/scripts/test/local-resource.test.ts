import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { QueryClient, QueryObserver, type UseQueryOptions } from '@tanstack/react-query'
import { store } from '../../src/renderer/src/state/utils'
import { userIdAtom } from '../../src/renderer/src/state/session'
import {
  useLocalResource,
  useLocalResources,
} from '../../src/renderer/src/data/hooks/local-resource'
import { ResourceNotFoundError } from '../../src/renderer/src/lib/utils/network'
import { isResourceHidden } from '../../src/renderer/src/data/hooks/resource-visibility'

const context = vi.hoisted(() => ({ client: null as unknown as QueryClient }))
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<typeof import('@tanstack/react-query')>()),
  useQuery: (options: unknown) => options,
  useQueryClient: () => context.client,
}))
vi.mock('jotai', async (original) => ({
  ...(await original<typeof import('jotai')>()),
  useAtomValue: (atom: typeof userIdAtom) => store.get(atom),
}))
vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: async () => false,
  set: async () => {},
  del: async () => {},
}))
const old = (id: number) => ({ id, last_update_at: new Date(0) })
const key = (id: number) => ['resource-test', store.get(userIdAtom), { id }]
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
function options(
  id: number,
  fetch: () => Promise<ReturnType<typeof old>>,
  save = vi.fn(async () => {}),
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Hooks are mocked to expose options to a real QueryObserver.
  return useLocalResource({
    queryKey: ['resource-test'],
    apiParams: { id },
    dbParams: { id },
    apiQueryFn: fetch,
    dbQueryFn: async () => old(id),
    updateDB: save,
    retry: false,
  }) as unknown as UseQueryOptions<ReturnType<typeof old>>
}
beforeEach(() => {
  context.client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  vi.stubGlobal('navigator', { onLine: true })
  store.set(userIdAtom, null)
})
afterEach(() => {
  context.client.clear()
  vi.unstubAllGlobals()
})

test('stale detail is shown during managed refresh, then a 404 clears it and persists visibility', async () => {
  const gate = deferred<ReturnType<typeof old>>()
  const observer = new QueryObserver(
    context.client,
    options(701, () => gate.promise),
  )
  const unsubscribe = observer.subscribe(() => {})
  await vi.waitFor(() => expect(observer.getCurrentResult().data?.id).toBe(701))
  expect(observer.getCurrentResult().fetchStatus).toBe('fetching')
  // Rejection handled by Query, including a stale-cache refresh.
  gate.resolve(Promise.reject(new ResourceNotFoundError()) as never)
  await vi.waitFor(() => expect(observer.getCurrentResult().status).toBe('error'))
  expect(observer.getCurrentResult().data).toBeUndefined()
  expect(await isResourceHidden(['resource-test'], null, 701)).toBe(true)
  unsubscribe()
})

test('temporary detail failure retains cached content', async () => {
  const result = await context.client.fetchQuery(
    options(702, async () => {
      throw new TypeError('Failed to fetch')
    }),
  )
  expect(result?.id).toBe(702)
  expect(await isResourceHidden(['resource-test'], null, 702)).toBe(false)
})

test('account changes discard in-flight results and stop the remaining batch', async () => {
  const gate = deferred<ReturnType<typeof old>>()
  const fetch = vi.fn(() => gate.promise),
    save = vi.fn(async () => {})
  const config = useLocalResources({
    queryKey: ['resource-test'],
    dbParams: { ids: [703, 704] },
    apiQueryFn: fetch,
    dbQueryFn: async () => [old(703)],
    updateDB: save,
    retry: false,
  }) as unknown as UseQueryOptions<(ReturnType<typeof old> | null)[]>
  const result = context.client.fetchQuery(config)
  const cancelled = expect(result).rejects.toMatchObject({ name: 'AbortError' })
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  store.set(userIdAtom, 'another-account')
  store.set(userIdAtom, null)
  gate.resolve(old(703))
  await cancelled
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(save).not.toHaveBeenCalled()
  expect(context.client.getQueryData(key(703))).toBeUndefined()
})

test('unmounting the last observer prevents late writes and publications', async () => {
  const gate = deferred<ReturnType<typeof old>>()
  const save = vi.fn(async () => {})
  const fetch = vi.fn(() => gate.promise)
  const observer = new QueryObserver(context.client, options(705, fetch, save))
  const unsubscribe = observer.subscribe(() => {})
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  unsubscribe()
  gate.resolve(old(705))
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(save).not.toHaveBeenCalled()
  expect(context.client.getQueryData(key(705))).toBeUndefined()
})
