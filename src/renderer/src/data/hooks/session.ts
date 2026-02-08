import { getUserInfoWithAuth } from '@renderer/data/fetch/api/user'
import { logout, getAccessToken } from '@renderer/data/fetch/session'
import { logger } from '@renderer/lib/logger'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import { createSingletonPromise } from '@renderer/lib/utils/promise'

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

  const firstCaller = !logoutSingleton.isRunning()
  if (firstCaller) {
    await logger.error('auth-session', 'Authentication error, logging out user')
  }

  // Show a toast notification only if logout is not already in progress and showToast is true
  if (options?.showToast && firstCaller) {
    toast.error('登录已过期，请重新登录', {
      id: 'auth-expired',
      duration: 3000,
    })
  }

  // Use the singleton promise to ensure only one logout happens
  // All concurrent callers will await the same promise
  return logoutSingleton.runOrAwait(() => logout())
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

export function useSession() {
  return useSessionQuery().data
}
