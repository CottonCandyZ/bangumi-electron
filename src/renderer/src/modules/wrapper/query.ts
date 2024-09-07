import { useAccessTokenQuery, useRefreshTokenMutation } from '@renderer/data/hooks/session'
import { createIDBPersister } from '@renderer/lib/persister'
import { AuthError } from '@renderer/lib/utils/error'
import { QueryCache, QueryClient, useQueryClient } from '@tanstack/react-query'
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
    },
  },
})

export const persister = createIDBPersister()

export const useIsUnauthorized = () => {
  const client = useQueryClient()
  const accessToken = useAccessTokenQuery().data
  const refreshMutation = useRefreshTokenMutation()

  useEffect(() => {
    client.getQueryCache().subscribe((e) => {
      if (
        e.type === 'updated' &&
        e.action.type === 'error' &&
        e.action.error instanceof AuthError
      ) {
        const code = e.action.error.code
        if (code === 2 || code === 3)
          if (accessToken) {
            refreshMutation.mutate(accessToken.refresh_token)
          }
      }
    })
  }, [client, accessToken, refreshMutation])
  useEffect(() => {
    client.getMutationCache().subscribe((e) => {
      if (e.mutation?.state.error instanceof AuthError) {
        const code = e.mutation.state.error.code
        if (code === 2 || code === 3)
          if (accessToken) {
            refreshMutation.mutate(accessToken.refresh_token)
          }
      }
    })
  }, [client, accessToken, refreshMutation])
}
