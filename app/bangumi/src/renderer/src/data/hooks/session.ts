import { getUserInfoWithAuth } from '@renderer/data/fetch/api/user'
import { logout, getAccessToken } from '@renderer/data/fetch/session'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
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
 * Opens the login dialog for auth expiration if showLoginDialog is true
 */
export async function safeLogout(options?: { showLoginDialog?: boolean }) {
  // Get current user ID to check if we're already logged in
  const currentUserId = store.get(userIdAtom)

  // Only proceed with logout if user is currently logged in
  if (!currentUserId) return

  const firstCaller = !logoutSingleton.isRunning()
  if (options?.showLoginDialog && firstCaller) {
    store.set(loginDialogAtom, {
      open: true,
      content: { reason: 'session-expired' },
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

export function useSessionUsername() {
  return useSession()?.username
}
