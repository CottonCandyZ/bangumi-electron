import { client } from '@renderer/lib/client'
import { queryClient } from '@renderer/modules/wrapper/query'
import { getUserInfoWithAuth } from '@renderer/data/fetch/api/user'
import { logout, getAccessToken } from '@renderer/data/fetch/session'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { createSingletonPromise } from '@renderer/lib/utils/promise'
import { createStore, get } from 'idb-keyval'
import type { PersistedQuery } from '@tanstack/react-query-persist-client'
import type { LocalAccount } from '@shared/collection-sync'

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

const profileRefreshes = new Map<
  string,
  { at: number; promise: Promise<Awaited<ReturnType<typeof getUserInfoWithAuth>> | null> }
>()
function refreshLocalProfile(userId: string) {
  // An offline miss is not a completed refresh and must not suppress reconnect.
  if (!navigator.onLine || store.get(userIdAtom) !== userId) return Promise.resolve(null)
  const existing = profileRefreshes.get(userId)
  if (existing && Date.now() - existing.at < 60000) return existing.promise
  const promise = (async () => {
    if (!navigator.onLine || store.get(userIdAtom) !== userId) return null
    const token = await getAccessToken(userId)
    if (!token || store.get(userIdAtom) !== userId) return null
    const profile = await getUserInfoWithAuth()
    if (profile.id !== Number(userId) || store.get(userIdAtom) !== userId) return null
    await client.collectionSaveAccount(profile)
    queryClient.setQueryData(['userSession', userId], profile)
    return profile
  })()
  profileRefreshes.set(userId, { at: Date.now(), promise })
  const discard = () => {
    if (profileRefreshes.get(userId)?.promise === promise) profileRefreshes.delete(userId)
  }
  void promise.then((profile) => {
    if (!profile) discard()
  }, discard)
  return promise
}
function useSessionQuery() {
  const userId = useAtomValue(userIdAtom)
  return useQuery({
    queryKey: ['userSession', userId],
    networkMode: 'always',
    persister: undefined,
    queryFn: async () => {
      if (!userId) return null
      const local = await client.collectionAccount({ userId: Number(userId) })
      if (local) {
        void refreshLocalProfile(userId).catch(() => {})
        return local
      }
      // Older versions persisted this profile in IndexedDB instead of LocalAccount.
      // Bootstrap only the active account; cache age does not invalidate offline identity.
      try {
        const cached = await get<PersistedQuery>(
          `tanstack-query-${JSON.stringify(['userSession', userId])}`,
          createStore('cache', 'query_persister'),
        )
        const profile = cached?.state.data as LocalAccount | undefined
        if (
          profile?.id === Number(userId) &&
          typeof profile.username === 'string' &&
          store.get(userIdAtom) === userId
        ) {
          await client.collectionSaveAccount(profile)
          void refreshLocalProfile(userId).catch(() => {})
          return profile
        }
      } catch {
        // An unavailable legacy cache must not prevent a normal online login.
      }
      try {
        return await refreshLocalProfile(userId)
      } catch {
        return null
      }
    },
  })
}

export function useSession() {
  return useSessionQuery().data
}

export function useSessionUsername() {
  return useSession()?.username
}
