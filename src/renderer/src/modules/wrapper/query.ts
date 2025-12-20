import { newIdbStorage } from '@renderer/lib/persister'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import {
  experimental_createQueryPersister,
  type PersistedQuery,
} from '@tanstack/react-query-persist-client'
import { createStore } from 'idb-keyval'
import { toast } from 'sonner'

const persister = experimental_createQueryPersister<PersistedQuery>({
  storage: newIdbStorage(createStore('cache', 'query_persister')),
  maxAge: 60 * 1000 * 60 * 24, // 1 day
  serialize: (persistedQuery) => persistedQuery,
  deserialize: (cached) => cached,
})

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
      persister: persister.persisterFn,
      networkMode: 'online',
    },
  },
})
