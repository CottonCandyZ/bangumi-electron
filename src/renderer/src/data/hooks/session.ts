import { getUserInfoWithAuth } from '@renderer/data/fetch/api/user'
import { readAccessToken } from '@renderer/data/fetch/db/user'
import { isAccessTokenValid, logout, getAccessToken } from '@renderer/data/fetch/session'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { queryClient } from '@renderer/modules/wrapper/query'
import { isRefreshingTokenAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { createSingletonPromise } from '@renderer/lib/utils/promise'
import { useAuthSuspenseQuery } from '@renderer/data/hooks/factory'

function logoutResetQuery() {
  queryClient.cancelQueries({ queryKey: ['authFetch'] })
  queryClient.setQueryData(['accessToken'], null)
  queryClient.invalidateQueries({ queryKey: ['accessToken'] })
  queryClient.invalidateQueries({ queryKey: ['authFetch'] })
}

/**
 * Logout 的 Mutate
 */
export const useLogoutMutation = () => {
  return useMutation({
    mutationKey: ['session'],
    mutationFn: logout,
    onSuccess: () => {
      logoutResetQuery()
    },
  })
}

// Create a singleton promise for logout operations
const logoutSingleton = createSingletonPromise<void>()

/**
 * Regular logout function - performs the actual logout operations
 */
export async function logoutAndRefresh() {
  await logout()
  logoutResetQuery()
}

/**
 * Safe logout function that ensures only one logout operation happens at a time
 * Shows a toast notification for auth expiration if showToast is true
 */
export async function safeLogout(options?: { showToast?: boolean }) {
  // Get current user ID to check if we're already logged in
  const currentUserId = localStorage.getItem('current_user_id')

  // Only proceed with logout if user is currently logged in
  if (!currentUserId) return

  console.error('Authentication error, logging out user')

  // Show a toast notification only if logout is not already in progress and showToast is true
  if (options?.showToast && !logoutSingleton.isRunning()) {
    toast.error('登录已过期，请重新登录', {
      id: 'auth-expired',
      duration: 3000,
    })
  }

  // Use the singleton promise to ensure only one logout happens
  // All concurrent callers will await the same promise
  return logoutSingleton.runOrAwait(() => logoutAndRefresh())
}

/**
 * 在任何情况下获得 AccessToken
 *
 * @returns 不存在时返回 Null，而非抛出异常
 */
export const useAccessTokenQuery = () => {
  // const refreshToken = useRefreshTokenMutation()
  // const logout = useLogoutMutation()
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
      // if (!(await isWebLogin())) {
      //   logout.mutate()
      //   return null
      // }
      // token 过期
      // if (
      //   data.expires_in + data.create_time.getTime() < new Date().getTime() ||
      //   !(await isAccessTokenValid(data))
      // ) {
      //   return { ...(await refreshToken.mutateAsync({ ...data })), create_time: new Date() }
      // }
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
  const resetAccessToken = useCallback(
    (data?: ReturnType<typeof useAccessTokenQuery>['data']) => {
      if (data) {
        client.setQueryData<ReturnType<typeof useAccessTokenQuery>['data']>(['accessToken'], data)
      } else {
        client.invalidateQueries({ queryKey: ['accessToken'] })
      }
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
    if (!accessToken) {
      toast.error('无法刷新 Token：登录信息丢失')
      resetAccessToken()
      return
    }
    if (
      accessToken.expires_in + accessToken.create_time.getTime() < new Date().getTime() ||
      !(await isAccessTokenValid(accessToken))
    ) {
      try {
        const newAccessToken = await refreshMutation.mutateAsync({ ...accessToken })
        resetAccessToken({ ...newAccessToken, create_time: new Date() })
        toast.success('Token 刷新成功')
      } catch (e) {
        console.error(e)
        toast.error('Token 刷新失败（可能是已过期）')
        resetAccessToken()
      }
    }
    store.set(isRefreshingTokenAtom, false)
    client.invalidateQueries({ queryKey: ['authFetch'] })
  }, [refreshMutation, client, resetAccessToken])
}

export function useSessionQuery() {
  return useAuthSuspenseQuery({
    queryKey: ['userSession'],
    queryFn: async () => {
      const accessToken = await getAccessToken()
      if (!accessToken) return null
      return await getUserInfoWithAuth()
    },
  })
}

export function useSession() {
  return useSessionQuery().data
}

export function getCurrentUserId() {
  return localStorage.getItem('current_user_id')
}
