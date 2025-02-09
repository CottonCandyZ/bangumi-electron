import { useAccessTokenQuery, useRefreshTokenMutation } from '@renderer/data/hooks/session'
import { newIdbStorage } from '@renderer/lib/persister'
import { AuthCode, AuthError } from '@renderer/lib/utils/error'
import { isRefreshingTokenAtom } from '@renderer/state/session'
import { QueryCache, QueryClient, useQueryClient } from '@tanstack/react-query'
import { experimental_createPersister, PersistedQuery } from '@tanstack/react-query-persist-client'
import { createStore } from 'idb-keyval'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { store } from '../../state/utils'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 已经获得了数据，但是在更新时出错
      if (query.state.data !== undefined) {
        toast.error(error.message)
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.DEV ? 1000 * 60 * 60 * 5 : 1000 * 60 * 5,
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
  const refreshMutation = useRefreshTokenMutation()

  const refresh = useCallback(
    async (code: AuthCode) => {
      if (store.get(isRefreshingTokenAtom)) return
      store.set(isRefreshingTokenAtom, true)
      const accessToken = (await queryClient.ensureQueryData({
        queryKey: ['accessToken'],
      })) as ReturnType<typeof useAccessTokenQuery>['data']
      if (code === AuthCode.EXPIRE && accessToken) {
        queryClient.cancelQueries({ queryKey: [accessToken] })
        refreshMutation.mutate({ ...accessToken })
      }
    },
    [refreshMutation],
  )

  useEffect(() => {
    const unsubscribe = client.getQueryCache().subscribe(async (e) => {
      if (
        e.type === 'updated' &&
        e.action.type === 'error' &&
        e.action.error instanceof AuthError
      ) {
        refresh(e.action.error.code)
      }
    })
    return () => unsubscribe()
  }, [client, refresh])
  useEffect(() => {
    const unsubscribe = client.getMutationCache().subscribe(async (e) => {
      if (e.mutation?.state.error instanceof AuthError) {
        refresh(e.mutation.state.error.code)
      }
    })
    return () => unsubscribe()
  }, [client, refresh])
}
