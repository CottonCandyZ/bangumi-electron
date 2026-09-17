import { parentPort, workerData } from 'node:worker_threads'
import Database from 'better-sqlite3'
import { CollectionRepository } from './repository'
import { createCollectionService } from './service-core'
import { createCollectionApi } from './worker-api'
import { CollectionRpc } from './rpc'
import { SyncError, type CollectionTransport } from './sync'
import type { CollectionNetworkApi } from './service'
import { createDatabaseApi } from '../lib/db-operations'

const port = parentPort!
const sqlite = new Database(workerData.filename)
const repository = new CollectionRepository(sqlite)
let transportSequence = 0
const service = createCollectionService(
  repository,
  (userId, signal, onProfile) => {
    const transportId = ++transportSequence
    const close = () => {
      void rpc.call('close', transportId).catch(() => {})
    }
    signal.addEventListener('abort', close, { once: true })
    const call = async <K extends 'read' | 'write' | 'list'>(
      method: K,
      args: Parameters<CollectionTransport[K]>,
    ) => {
      signal.throwIfAborted()
      try {
        const response = await rpc.call('request', transportId, userId, method, args)
        signal.throwIfAborted()
        if (response.profile) onProfile?.(response.profile)
        return response.value
      } catch (error) {
        signal.throwIfAborted()
        const failure = error as Error & { kind?: SyncError['kind'] }
        if (failure.kind) throw new SyncError(failure.message, failure.kind)
        throw error
      }
    }
    return {
      read: async (id) =>
        (await call('read', [id])) as Awaited<ReturnType<CollectionTransport['read']>>,
      write: async (...args) => {
        await call('write', args)
      },
      list: async (...args) =>
        (await call('list', args)) as Awaited<ReturnType<CollectionTransport['list']>>,
      dispose() {
        signal.removeEventListener('abort', close)
        close()
      },
    }
  },
  (change) => port.postMessage({ event: 'collections-changed', data: change }),
  (userId, overview) =>
    port.postMessage({ event: 'collection-sync-progress', data: { userId, overview } }),
)
const rpc = new CollectionRpc<CollectionNetworkApi>(port, {
  ...createCollectionApi(service, repository),
  ...createDatabaseApi(sqlite),
})
port.on('close', () => {
  service.dispose()
  sqlite.close()
})
