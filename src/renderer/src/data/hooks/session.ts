import { logout } from '@renderer/data/fetch/session'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { client } from '@renderer/lib/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Logout 的 Mutate
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['session'],
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['accessToken'], null)
    },
  })
}

/**
 * 在任何情况下获得 AccessToken
 *
 * @returns 不存在时返回 Null，而非抛出异常
 */
export const useAccessTokenQuery = () => {
  return useQuery({
    queryKey: ['accessToken'],
    queryFn: async () => {
      return await client.getAccessToken()
    },
  })
}

export const useRefreshTokenMutation = () => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refreshToken,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
    },
    onError() {
      logoutMutation.mutate()
    },
  })
}
