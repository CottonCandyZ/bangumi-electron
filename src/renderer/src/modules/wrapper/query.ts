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
      // Check if this is a 401 error from ofetch
      const isAuthError =
        error instanceof Error &&
        error.message.includes('401') &&
        error.message.includes('UNAUTHORIZED')

      if (isAuthError) {
        // For 401 errors, we don't need to show another toast since
        // the onResponseError handler in base.ts already shows one

        // Mark the query as successful with its previous data to prevent
        // the error from propagating to error boundaries when using Suspense
        if (query.state.data !== undefined) {
          queryClient.setQueryData(query.queryKey, query.state.data)
        }

        // Return to prevent the error from propagating
        return
      }

      // For other errors, show a toast if we already have data
      if (query.state.data !== undefined) {
        toast.error(error.message)
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.DEV ? 1000 * 60 * 60 * 5 : 1000 * 60 * 5,
      gcTime: import.meta.env.DEV ? Number.POSITIVE_INFINITY : 60 * 1000 * 60 * 24,
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
        //FIXME: need to remove
        console.error(e.action.error)
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
