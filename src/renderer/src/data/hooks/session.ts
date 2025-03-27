import { readAccessToken } from '@renderer/data/fetch/db/user'
import { isAccessTokenValid, isWebLogin, logout } from '@renderer/data/fetch/session'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { isRefreshingTokenAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'

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
      // 没有 user_id，说明没有登录
      if (!user_id) return null
      const data = await readAccessToken({ user_id: Number(user_id) })
      // 没有 token，说明没有登录
      if (!data) return null
      // 没有 Web 登录，说明没有登录
      // TODO: 判断联网情况
      if (!(await isWebLogin())) {
        logout.mutate()
        return null
      }
      // token 过期
      if (
        data.expires_in + data.create_time.getTime() < new Date().getTime() ||
        !(await isAccessTokenValid(data))
      ) {
        return { ...(await refreshToken.mutateAsync({ ...data })), create_time: new Date() }
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
  const finish = useCallback(
    (data?: ReturnType<typeof useAccessTokenQuery>['data']) => {
      if (data) {
        client.setQueryData<ReturnType<typeof useAccessTokenQuery>['data']>(['accessToken'], data)
      } else {
        client.invalidateQueries({ queryKey: ['accessToken'] })
      }
      client.invalidateQueries({ queryKey: ['authFetch'] })
      store.set(isRefreshingTokenAtom, false)
    },
    [client],
  )
  return useCallback(async () => {
    if (store.get(isRefreshingTokenAtom)) return
    toast.info('正在刷新 Token...')
    store.set(isRefreshingTokenAtom, true)
    client.cancelQueries({ queryKey: ['authFetch'] })
    const accessToken = await client.ensureQueryData<
      ReturnType<typeof useAccessTokenQuery>['data']
    >({ queryKey: ['accessToken'] })
    if (
      accessToken &&
      (accessToken.expires_in + accessToken.create_time.getTime() < new Date().getTime() ||
        !(await isAccessTokenValid(accessToken)))
    ) {
      try {
        const newAccessToken = await refreshMutation.mutateAsync({ ...accessToken })
        finish({ ...newAccessToken, create_time: new Date() })
        toast.success('Token 刷新成功')
      } catch (e) {
        console.error(e)
        toast.error('Token 刷新失败（可能是已过期）')
      }
    } else {
      finish()
      toast.error('Token 已过期')
    }
  }, [refreshMutation, client, finish])
}
