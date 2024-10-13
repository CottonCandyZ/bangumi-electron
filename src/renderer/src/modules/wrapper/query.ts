import { useAccessTokenQuery, useRefreshTokenMutation } from '@renderer/data/hooks/session'
import { newIdbStorage } from '@renderer/lib/persister'
import { AuthError } from '@renderer/lib/utils/error'
import { isRefreshingTokenAtom } from '@renderer/state/session'
import { QueryCache, QueryClient, useQueryClient } from '@tanstack/react-query'
import { experimental_createPersister, PersistedQuery } from '@tanstack/react-query-persist-client'
import { createStore } from 'idb-keyval'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 已经获得了数据，但是在更新时出错
      if (query.state.data === null) {
        toast.error(error.message)
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.DEV ? 1000 * 60 * 60 * 5 : 20 * 1000,
      gcTime: import.meta.env.DEV ? Infinity : 60 * 1000 * 5,
      retry: 0,
      persister: experimental_createPersister<PersistedQuery>({
        storage: newIdbStorage(createStore('cache', 'query_persister')),
        maxAge: 60 * 1000 * 60 * 24,
        serialize: (persistedQuery) => persistedQuery,
        deserialize: (cached) => cached,
      }),
      networkMode: 'online',
    },
  },
})

export const useIsUnauthorized = () => {
  const client = useQueryClient()
  const accessToken = useAccessTokenQuery().data
  const refreshMutation = useRefreshTokenMutation()
  const [isRefreshing, setIsRefreshing] = useAtom(isRefreshingTokenAtom)

  useEffect(() => {
    const unsubscribe = client.getQueryCache().subscribe((e) => {
      if (
        e.type === 'updated' &&
        e.action.type === 'error' &&
        e.action.error instanceof AuthError
      ) {
        const code = e.action.error.code
        if (code === 2 && accessToken && !isRefreshing) {
          setIsRefreshing(true)
          queryClient.cancelQueries()
          refreshMutation.mutate({ ...accessToken })
        }
      }
    })
    return () => {
      unsubscribe()
    }
  }, [client, accessToken, refreshMutation, setIsRefreshing, isRefreshing])
  useEffect(() => {
    const unsubscribe = client.getMutationCache().subscribe((e) => {
      if (e.mutation?.state.error instanceof AuthError) {
        const code = e.mutation.state.error.code
        if (code === 2 && accessToken && !isRefreshing) {
          setIsRefreshing(true)
          queryClient.cancelQueries()
          refreshMutation.mutate({ ...accessToken })
        }
      }
    })
    return () => unsubscribe()
  }, [client, accessToken, refreshMutation, setIsRefreshing, isRefreshing])
}
