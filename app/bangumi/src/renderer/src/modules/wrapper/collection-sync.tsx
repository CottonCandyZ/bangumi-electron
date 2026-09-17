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
import type { CollectionChange, SyncOverview } from '@shared/collection-sync'

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
    void client.collectionActivate({ userId }).then(() => {
      if (userId) void invalidateCollections({ userId, subjectIds: null })
      void queryClient.invalidateQueries({ queryKey: ['collection-sync'] })
    })
    if (userId) void getAccessToken(String(userId)).catch(() => {})
    const unsubscribe = window.electron.ipcRenderer.on(
      'collections-changed',
      (_event, change: CollectionChange) => {
        if (change.userId === userId) void invalidateCollections(change)
      },
    )
    const unsubscribeProgress = window.electron.ipcRenderer.on(
      'collection-sync-progress',
      (_event, update: { userId: number; overview: SyncOverview }) => {
        if (update.userId !== userId) return
        const queryKey = ['collection-sync', userId]
        void queryClient.cancelQueries({ queryKey })
        queryClient.setQueryData(queryKey, update.overview)
      },
    )
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
