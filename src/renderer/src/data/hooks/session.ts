import { getUserInfoWithAuth } from '@renderer/data/fetch/api/user'
import { readAccessToken } from '@renderer/data/fetch/db/user'
import { logout, getAccessToken } from '@renderer/data/fetch/session'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import { createSingletonPromise } from '@renderer/lib/utils/promise'
import { useAuthSuspenseQuery } from '@renderer/data/hooks/factory'

/**
 * Logout 的 Mutate
 */
export const useLogoutMutation = () => {
  return useMutation({
    mutationKey: ['session'],
    mutationFn: logout,
  })
}

// Create a singleton promise for logout operations
const logoutSingleton = createSingletonPromise<void>()

/**
 * Safe logout function that ensures only one logout operation happens at a time
 * Shows a toast notification for auth expiration if showToast is true
 */
export async function safeLogout(options?: { showToast?: boolean }) {
  // Get current user ID to check if we're already logged in
  const currentUserId = store.get(userIdAtom)

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
  return logoutSingleton.runOrAwait(() => logout())
}

/**
 * 在任何情况下获得 AccessToken
 *
 * @returns 不存在时返回 Null，而非抛出异常
 */
export const useAccessTokenQuery = () => {
  // const refreshToken = useRefreshTokenMutation()
  // const logout = useLogoutMutation()
  const userId = useAtomValue(userIdAtom)
  return useQuery({
    queryKey: ['accessToken', userId],
    queryFn: async () => {
      // 没有 user_id，说明没有登录
      if (!userId) return null
      const data = await readAccessToken({ user_id: Number(userId) })
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

function useSessionSuspenseQuery() {
  const userId = useAtomValue(userIdAtom)
  return useAuthSuspenseQuery({
    queryKey: ['userSession', userId],
    queryFn: async () => {
      const accessToken = await getAccessToken(userId)
      if (!accessToken) return null
      return await getUserInfoWithAuth()
    },
  })
}

function useSessionQuery() {
  const userId = useAtomValue(userIdAtom)
  return useQuery({
    queryKey: ['userSession', userId],
    queryFn: async () => {
      const accessToken = await getAccessToken(userId)
      if (!accessToken) return null
      return await getUserInfoWithAuth()
    },
  })
}

export function useSessionSuspense() {
  return useSessionSuspenseQuery().data
}

export function useSession() {
  return useSessionQuery().data
}
