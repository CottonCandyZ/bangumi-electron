/// <reference types="electron-vite/node" />
import { app, BrowserWindow } from 'electron'
import createWorker from './worker?nodeWorker'
import { sqlite } from '../lib/db'
import { createCollectionTransport } from './transport'
import type { CollectionTransport } from './sync'
import type { LocalAccount } from '../../shared/collection-sync'
import type { CollectionApi } from './worker-api'
import { CollectionRpc } from './rpc'
import type { DatabaseApi } from '../lib/db-operations'

function createNetworkApi() {
  const transports = new Map<
    number,
    { transport: CollectionTransport; controller: AbortController; profile?: LocalAccount }
  >()
  return {
    async request(id: number, userId: number, method: 'read' | 'write' | 'list', args: unknown[]) {
      let entry = transports.get(id)
      if (!entry) {
        const controller = new AbortController()
        entry = {
          controller,
          transport: createCollectionTransport(userId, controller.signal, (profile) => {
            entry!.profile = profile
          }),
        }
        transports.set(id, entry)
      }
      const invoke = entry.transport[method] as (...args: unknown[]) => Promise<unknown>
      const value = await invoke(...args)
      const profile = entry.profile
      entry.profile = undefined
      return { value, profile }
    },
    close(id: number) {
      transports.get(id)?.controller.abort()
      transports.delete(id)
    },
    dispose() {
      for (const entry of transports.values()) entry.controller.abort()
      transports.clear()
    },
  }
}
export type CollectionNetworkApi = ReturnType<typeof createNetworkApi>

export type DataApi = CollectionApi & DatabaseApi
let connection: CollectionRpc<DataApi> | undefined
export function collectionService() {
  if (connection) return connection
  const network = createNetworkApi()
  const worker = createWorker({ workerData: { filename: sqlite.name } })
  const rpc = new CollectionRpc<DataApi>(worker, network)
  connection = rpc
  worker.on('message', (message) => {
    if (message.event !== 'collections-changed' && message.event !== 'collection-sync-progress')
      return
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send(message.event, message.data)
    }
  })
  worker.on('error', (error) => {
    rpc.fail(error)
    network.dispose()
  })
  worker.on('exit', () => {
    rpc.fail(new Error('收藏同步服务已停止，请重启应用'))
    network.dispose()
  })
  app.once('will-quit', () => {
    network.dispose()
    void worker.terminate()
  })
  worker.unref()
  return rpc
}
