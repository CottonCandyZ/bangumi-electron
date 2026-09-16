import { newIdbStorage } from '@renderer/lib/persister'
import { AuthError } from '@renderer/lib/utils/error'
import { isWebVerificationRequiredError } from '@renderer/data/fetch/config/web-access'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import {
  experimental_createQueryPersister,
  type PersistedQuery,
} from '@tanstack/react-query-persist-client'
import { createStore } from 'idb-keyval'
import { toast } from 'sonner'
import { CollectionPendingError, isNetworkUnavailableError } from '@renderer/lib/utils/network'

const persister = experimental_createQueryPersister<PersistedQuery>({
  storage: newIdbStorage(createStore('cache', 'query_persister')),
  maxAge: 60 * 1000 * 60 * 24, // 1 day
  serialize: (persistedQuery) => persistedQuery,
  deserialize: (cached) => cached,
})

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Blob URLs and one-time login challenges must never reuse a failed cached image.
      if (query.queryKey[0] === 'captcha' || error instanceof CollectionPendingError) return
      if (isNetworkUnavailableError(error)) {
        if (query.state.data !== undefined) {
          queryClient.setQueryData(query.queryKey, query.state.data, {
            updatedAt: query.state.dataUpdatedAt,
          })
          // Keep the original freshness and retry on reconnect, without another request now.
          void queryClient.invalidateQueries({
            queryKey: query.queryKey,
            exact: true,
            refetchType: 'none',
          })
        }
        return
      }
      if (isWebVerificationRequiredError(error)) {
        if (query.state.data !== undefined) {
          queryClient.setQueryData(query.queryKey, query.state.data)
        }
        return
      }

      if (error instanceof AuthError) {
        if (query.state.data !== undefined) {
          queryClient.setQueryData(query.queryKey, query.state.data)
        }
        return
      }

      // Check if this is a 401 error from ofetch
      const isAuthError =
        error instanceof Error &&
        error.message.includes('401') &&
        error.message.includes('UNAUTHORIZED')

      if (isAuthError) {
        // Background auth failures stay in the query state, without opening login UI.

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
      networkMode: 'offlineFirst',
    },
  },
})
