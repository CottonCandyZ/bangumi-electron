import { toast } from 'sonner'
import { store } from '@renderer/state/utils'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useOnline } from '@renderer/hooks/use-online'
import { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { sessionNeedsLoginAtom, userIdAtom } from '@renderer/state/session'
import { client } from '@renderer/lib/client'
import { invalidateCollections } from '@renderer/data/collection/client'
import { CollectionSyncDialog } from '@renderer/modules/common/collections/sync-dialog'
import { queryClient } from './query'
import { expireInvalidSession, getAccessToken } from '@renderer/data/fetch/session'

export function CollectionSyncProvider() {
  const userId = Number(useAtomValue(userIdAtom)) || null
  const needsLogin = useAtomValue(sessionNeedsLoginAtom)
  const online = useOnline()
  const commandWindow = window.location.hash.startsWith('#/command')
  useEffect(() => {
    if (commandWindow || !online || !needsLogin) return
    void expireInvalidSession()
      .then((expired) => {
        if (!expired) return
        toast.error('登录已过期，已退出登录，本地收藏已保留', {
          id: 'session-expired',
          action: {
            label: '登录',
            onClick: () =>
              store.set(loginDialogAtom, { open: true, content: { reason: 'session-expired' } }),
          },
        })
      })
      .catch(() => {
        toast.error('登录已过期，退出清理未完成，请重新登录', {
          id: 'session-expired',
          action: { label: '登录', onClick: () => store.set(loginDialogAtom, { open: true }) },
        })
      })
  }, [commandWindow, needsLogin, online])
  useEffect(() => {
    if (commandWindow) return
    void client.collectionActivate({ userId }).then(() => invalidateCollections())
    if (userId) void getAccessToken(String(userId)).catch(() => {})
    const unsubscribe = window.electron.ipcRenderer.on('collections-changed', () => {
      void invalidateCollections()
    })
    const unsubscribeProgress = window.electron.ipcRenderer.on('collection-sync-progress', () => {
      void queryClient.invalidateQueries({ queryKey: ['collection-sync'] })
    })
    const reconnect = async () => {
      if (!userId) return
      try {
        await getAccessToken(String(userId))
        await client.collectionSync({ userId })
        await queryClient.invalidateQueries({ queryKey: ['userSession'] })
      } catch {
        /* The sync panel retains actionable errors; local data remains available. */
      }
    }
    window.addEventListener('online', reconnect)
    return () => {
      unsubscribe()
      unsubscribeProgress()
      window.removeEventListener('online', reconnect)
    }
  }, [userId, commandWindow])
  return commandWindow ? null : <CollectionSyncDialog />
}
