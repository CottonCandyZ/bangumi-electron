import { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { userIdAtom } from '@renderer/state/session'
import { client } from '@renderer/lib/client'
import { invalidateCollections } from '@renderer/data/collection/client'
import { CollectionSyncDialog } from '@renderer/modules/common/collections/sync-dialog'
import { queryClient } from './query'
import { getAccessToken } from '@renderer/data/fetch/session'

export function CollectionSyncProvider() {
  const userId = Number(useAtomValue(userIdAtom)) || null
  const commandWindow = window.location.hash.startsWith('#/command')
  useEffect(() => {
    if (commandWindow) return
    void client.collectionActivate({ userId })
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
