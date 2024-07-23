import { isAccessTokenValid, isWebLogin, logout } from '@renderer/data/fetch/session'
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

/**
 * 查询登录状态，验证 cookie 和 token 均有效
 */
export const useIsLoginQuery = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { data: accessToken } = useAccessTokenQuery()
  const logoutMutation = useLogoutMutation()
  return useQuery({
    queryKey: ['isLogin', accessToken],
    queryFn: async () => {
      if (!accessToken) return false
      if (!(await isWebLogin()) && (await isAccessTokenValid(accessToken))) {
        logoutMutation.mutate()
        return false
      }
      return true
    },
    placeholderData: !!window.localStorage.getItem('isLogin'),
    enabled: enabled && accessToken !== undefined,
  })
}
