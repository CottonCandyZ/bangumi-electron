import { readAccessToken } from '@renderer/data/fetch/db/user'
import { isAccessTokenValid, isWebLogin, logout } from '@renderer/data/fetch/session'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { isRefreshingTokenAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

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
  const refreshToken = useRefreshTokenMutation()
  const logout = useLogoutMutation()
  return useQuery({
    queryKey: ['accessToken'],
    queryFn: async () => {
      const user_id = localStorage.getItem('current_user_id')
      if (!user_id) return null
      const data = await readAccessToken({ user_id: Number(user_id) })
      if (!data) return null
      if (!(await isWebLogin())) {
        logout.mutate()
        return null
      }
      if (
        data.expires_in + data.create_time.getTime() < new Date().getTime() ||
        !(await isAccessTokenValid(data))
      ) {
        return await refreshToken.mutateAsync({ ...data })
      }
      return data
    },
    networkMode: 'always',
  })
}

export const useRefreshTokenMutation = () => {
  const logoutMutation = useLogoutMutation()
  return useMutation({
    mutationFn: refreshToken,
    onError() {
      logoutMutation.mutate()
    },
  })
}

export const useRefreshToken = () => {
  const client = useQueryClient()
  const refreshMutation = useRefreshTokenMutation()
  return useCallback(async () => {
    if (store.get(isRefreshingTokenAtom)) return
    store.set(isRefreshingTokenAtom, true)
    const accessToken = await client.ensureQueryData<
      ReturnType<typeof useAccessTokenQuery>['data']
    >({ queryKey: ['accessToken'] })
    if (accessToken) {
      client.cancelQueries({ queryKey: [accessToken] })
      await refreshMutation.mutateAsync({ ...accessToken })
      client.invalidateQueries({ queryKey: ['accessToken'] })
      store.set(isRefreshingTokenAtom, false)
    }
  }, [refreshMutation, client])
}
