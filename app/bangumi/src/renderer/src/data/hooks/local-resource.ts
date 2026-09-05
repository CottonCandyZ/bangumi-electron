import {
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { DB_CONFIG } from '@renderer/config'
import { OfflineResourceError, ResourceNotFoundError } from '@renderer/lib/utils/network'
import { refreshResourceBatch } from './resource-refresh'
import { isResourceHidden, setResourceHidden } from './resource-visibility'
import { resourceRequests } from './resource-request-queue'

// Rotate on every transition, including A -> B -> A while a request is in flight.
let identity = new AbortController()
let identityVersion = 0
store.sub(userIdAtom, () => {
  identity.abort()
  identity = new AbortController()
  identityVersion++
})

type Resource = { id: number; last_update_at: Date }
type Options<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryFn'>
type RequestOptions = { signal: AbortSignal }

export function useLocalResource<
  P extends { id: number },
  D extends { id: number },
  T extends Resource,
>({
  queryKey,
  apiQueryFn,
  dbQueryFn,
  apiParams,
  dbParams,
  updateDB,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  needKeepPreviousData = true,
  ...options
}: {
  queryKey: QueryKey
  apiQueryFn: (params: P, options?: RequestOptions) => Promise<T>
  dbQueryFn: (params: D) => Promise<T | undefined>
  apiParams: P
  dbParams: D
  updateDB: (data: T) => Promise<void>
  dbStaleTime?: number
  needKeepPreviousData?: boolean
} & Options<T>) {
  return useResourceQuery({
    ...options,
    queryKey,
    dbParams,
    dbStaleTime,
    needKeepPreviousData,
    ids: [dbParams.id],
    fetch: (_id, signal) => apiQueryFn(apiParams, { signal }),
    read: async () => {
      const item = await dbQueryFn(dbParams)
      return item ? [item] : []
    },
    save: async (items) => {
      for (const item of items) await updateDB(item)
    },
    selectResult: (items) => {
      if (!items[0]) throw new ResourceNotFoundError()
      return items[0]
    },
  })
}

export function useLocalResources<
  P extends { id: number },
  D extends { ids?: number[] },
  T extends Resource,
>({
  queryKey,
  apiQueryFn,
  apiParams,
  dbQueryFn,
  updateDB,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  needKeepPreviousData = true,
  ...options
}: {
  queryKey: QueryKey
  apiQueryFn: (params: P, options?: RequestOptions) => Promise<T>
  apiParams?: Omit<P, 'id'>
  dbQueryFn: (params: D) => Promise<T[]>
  dbParams: D
  updateDB: (data: T[]) => Promise<void>
  dbStaleTime?: number
  needKeepPreviousData?: boolean
} & Options<(T | null)[]>) {
  return useResourceQuery({
    ...options,
    queryKey,
    dbParams,
    dbStaleTime,
    needKeepPreviousData,
    ids: dbParams.ids ?? [],
    fetch: (id, signal) => apiQueryFn({ ...apiParams, id } as P, { signal }),
    read: () => dbQueryFn(dbParams),
    save: updateDB,
    selectResult: (items) => items,
  })
}

function useResourceQuery<T extends Resource, R>({
  queryKey,
  dbParams,
  dbStaleTime,
  needKeepPreviousData,
  ids,
  fetch,
  read,
  save,
  selectResult,
  ...options
}: {
  queryKey: QueryKey
  dbParams: unknown
  dbStaleTime: number
  needKeepPreviousData: boolean
  ids: number[]
  fetch: (id: number, signal: AbortSignal) => Promise<T>
  read: () => Promise<T[]>
  save: (items: T[]) => Promise<void>
  selectResult: (items: (T | null)[]) => R
} & Options<R>) {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const key = [...queryKey, userId, dbParams]
  const sessionSignal = identity.signal
  const version = identityVersion
  return useQuery({
    ...options,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The signal cancels a session; userId already partitions cached data.
    queryKey: key,
    networkMode: 'always',
    persister: undefined,
    refetchOnReconnect: true,
    staleTime: dbStaleTime,
    placeholderData: needKeepPreviousData
      ? (previous, query) => (query?.queryKey[queryKey.length] === userId ? previous : undefined)
      : undefined,
    queryFn: async ({ signal: querySignal }) => {
      const signal = AbortSignal.any([querySignal, sessionSignal])
      const check = () => {
        signal.throwIfAborted()
        if (store.get(userIdAtom) !== userId)
          throw new DOMException('Account changed', 'AbortError')
      }
      check()
      const cached = await read()
      const visible = await Promise.all(
        cached.map(async (item) =>
          (await isResourceHidden(queryKey, userId, item.id)) ? null : item,
        ),
      )
      check()
      const data = new Map<number, T>()
      for (const item of visible) if (item) data.set(item.id, item)
      const ordered = () => ids.map((id) => data.get(id) ?? null)
      const stale = ids.filter(
        (id) => !data.has(id) || Date.now() - data.get(id)!.last_update_at.getTime() > dbStaleTime,
      )
      if (!navigator.onLine) {
        if (ids.length && !data.size) throw new OfflineResourceError()
        return selectResult(ordered())
      }
      if (stale.length) {
        // Show SQLite data immediately, while Query continues to own the refresh and cancellation.
        if (data.size) queryClient.setQueryData(key, selectResult(ordered()))
        await refreshResourceBatch({
          ids: stale,
          data,
          check,
          fetch: (id) =>
            resourceRequests.run(
              JSON.stringify([queryKey, version, userId, id]),
              signal,
              async (requestSignal) => {
                sessionSignal.throwIfAborted()
                requestSignal.throwIfAborted()
                return fetch(id, requestSignal)
              },
            ),
          save: async (items) => {
            check()
            await save(items)
            check()
            for (const item of items) {
              check()
              await setResourceHidden(queryKey, userId, item.id, false)
            }
          },
          remove: async (missing) => {
            for (const id of missing) {
              check()
              await setResourceHidden(queryKey, userId, id, true)
            }
          },
          evict: (id) => {
            check()
            // Clear stale detail data without starting a recursive refetch of an active query.
            const detail = queryClient
              .getQueryCache()
              .find({ queryKey: [...queryKey, userId, { id }], exact: true })
            detail?.setState({
              data: undefined,
              error: new ResourceNotFoundError(),
              status: 'error',
            })
          },
          publish: (item) => {
            check()
            queryClient.setQueryData([...queryKey, userId, { id: item.id }], item)
          },
        })
      }
      check()
      return selectResult(ordered())
    },
  })
}
