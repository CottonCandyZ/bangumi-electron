import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userIdAtom } from '@renderer/state/session'
import { DB_CONFIG } from '@renderer/config'
import { OfflineResourceError } from '@renderer/lib/utils/network'
import { refreshResourceBatch } from './resource-refresh'

type Resource = { last_update_at: Date }
type Options<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryFn'>
const refreshing = new Set<string>()
// Resource caches may refresh after returning stale data. Collection commands never use this path.
function refreshLater<T>(key: QueryKey, refresh: () => Promise<T>, publish: (value: T) => void) {
  const hash = JSON.stringify(key)
  if (refreshing.has(hash) || !navigator.onLine) return
  refreshing.add(hash)
  setTimeout(() => {
    void refresh()
      .then(publish)
      .catch(() => {})
      .finally(() => refreshing.delete(hash))
  }, 0)
}
export function useLocalResource<P, D, T extends Resource>({
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
  apiQueryFn: (params: P) => Promise<T>
  dbQueryFn: (params: D) => Promise<T | undefined>
  apiParams: P
  dbParams: D
  updateDB: (data: T) => Promise<void>
  dbStaleTime?: number
  needKeepPreviousData?: boolean
} & Options<T>) {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const key = [...queryKey, userId, dbParams]
  const refresh = async () => {
    const value = await apiQueryFn(apiParams)
    await updateDB(value)
    return value
  }
  return useQuery({
    ...options,
    queryKey: key,
    networkMode: 'always',
    persister: undefined,
    refetchOnReconnect: true,
    staleTime: dbStaleTime,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    queryFn: async () => {
      const local = await dbQueryFn(dbParams)
      if (local) {
        if (Date.now() - local.last_update_at.getTime() > dbStaleTime) {
          refreshLater(key, refresh, (value) => queryClient.setQueryData(key, value))
        }
        return local
      }
      if (!navigator.onLine) throw new OfflineResourceError()
      return refresh()
    },
  })
}
export function useLocalResources<
  P extends { id: number },
  D extends { ids?: number[] },
  T extends Resource & { id: number },
>({
  queryKey,
  apiQueryFn,
  apiParams,
  dbQueryFn,
  updateDB,
  removeDB,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  needKeepPreviousData = true,
  ...options
}: {
  queryKey: QueryKey
  apiQueryFn: (params: P) => Promise<T>
  apiParams?: Omit<P, 'id'>
  dbQueryFn: (params: D) => Promise<T[]>
  dbParams: D
  updateDB: (data: T[]) => Promise<void>
  removeDB?: (ids: number[]) => Promise<void>
  dbStaleTime?: number
  needKeepPreviousData?: boolean
} & Options<(T | null)[]>) {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const key = [...queryKey, userId, dbParams]
  return useQuery({
    ...options,
    queryKey: key,
    networkMode: 'always',
    persister: undefined,
    refetchOnReconnect: true,
    staleTime: dbStaleTime,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    queryFn: async () => {
      const ids = dbParams.ids ?? []
      const local = await dbQueryFn(dbParams)
      const data = new Map(local.map((item) => [item.id, item]))
      const ordered = () => ids.map((id) => data.get(id) ?? null)
      const stale = ids.filter(
        (id) => !data.has(id) || Date.now() - data.get(id)!.last_update_at.getTime() > dbStaleTime,
      )
      const refresh = async () => {
        await refreshResourceBatch({
          ids: stale,
          data,
          fetch: (id) => apiQueryFn({ ...apiParams, id } as P),
          save: updateDB,
          remove: removeDB,
          publish: (item) => queryClient.setQueryData([...queryKey, userId, { id: item.id }], item),
        })
        return ordered()
      }
      if (stale.length && navigator.onLine) {
        if (!local.length) return refresh()
        refreshLater(key, refresh, (value) => queryClient.setQueryData(key, value))
      }
      if (ids.length && !local.length && !navigator.onLine) throw new OfflineResourceError()
      return ordered()
    },
  })
}
