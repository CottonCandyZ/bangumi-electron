import { isAccessTokenValid, isWebLogin, logout } from '@renderer/data/fetch/session'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { client } from '@renderer/lib/client'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Logout 的 Mutate
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['session'],
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['isLogin'], false)
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
      return await client.getAccessToken()
    },
  })
}

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: refreshToken,
  })
}

/**
 * 查询登录状态，验证 cookie 和 token 均有效
 */
export const useIsLoginQuery = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { data: accessToken } = useAccessTokenQuery()
  const queryClient = useQueryClient()

  const logoutMutation = useLogoutMutation()
  const refreshMutation = useRefreshToken()
  return useQuery({
    queryKey: ['isLogin', accessToken],
    queryFn: async () => {
      if (!accessToken) return false
      if (!(await isWebLogin())) {
        logoutMutation.mutate()
        return false
      }
      if (!(await isAccessTokenValid(accessToken))) {
        // try to refresh
        try {
          await refreshMutation.mutateAsync(accessToken.refresh_token)
          queryClient.invalidateQueries({ queryKey: ['accessToken'] })
        } catch (e) {
          //FIXME: 添加在网页登录时 重新自动登陆的设定
          logoutMutation.mutate()
          return false
        }
      }
      return true
    },
    placeholderData: keepPreviousData,
    enabled: enabled && accessToken !== undefined,
  })
}
