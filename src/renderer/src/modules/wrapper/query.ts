import { useRefreshToken } from '@renderer/data/hooks/session'
import { newIdbStorage } from '@renderer/lib/persister'
import { AuthCode, AuthError } from '@renderer/lib/utils/error'
import { QueryCache, QueryClient, useQueryClient } from '@tanstack/react-query'
import {
  experimental_createPersister,
  type PersistedQuery,
} from '@tanstack/react-query-persist-client'
import { createStore } from 'idb-keyval'
import { useEffect } from 'react'
import { toast } from 'sonner'

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
      gcTime: import.meta.env.DEV ? Number.MAX_VALUE : 60 * 1000 * 5,
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
  const refresh = useRefreshToken()
  useEffect(() => {
    const unsubscribe = client.getQueryCache().subscribe(async (e) => {
      if (
        e.type === 'updated' &&
        e.action.type === 'error' &&
        e.action.error instanceof AuthError &&
        e.action.error.code === AuthCode.EXPIRE
      ) {
        refresh()
      }
    })
    return () => unsubscribe()
  }, [client, refresh])
  useEffect(() => {
    const unsubscribe = client.getMutationCache().subscribe(async (e) => {
      if (
        e.mutation?.state.error instanceof AuthError &&
        e.mutation.state.error.code === AuthCode.EXPIRE
      ) {
        refresh()
      }
    })
    return () => unsubscribe()
  }, [client, refresh])
}
