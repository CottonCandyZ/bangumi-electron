import { readAccessToken } from '@renderer/data/fetch/db/user'
import { logout } from '@renderer/data/fetch/session'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { isRefreshingTokenAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
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
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
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
      const user_id = localStorage.getItem('current_user_id')
      if (!user_id) return null
      return await readAccessToken({ user_id: Number(user_id) })
    },
    networkMode: 'always',
  })
}

export const useRefreshTokenMutation = () => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refreshToken,
    onSettled() {
      store.set(isRefreshingTokenAtom, false)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
    },
    onError() {
      logoutMutation.mutate()
    },
  })
}
