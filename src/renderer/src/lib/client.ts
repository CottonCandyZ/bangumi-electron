import { createClient, createEventHandlers } from '@egoist/tipc/renderer'
import { Router } from 'src/main/tipc'
import { RendererHandlers } from 'src/main/tipc/renderer-handlers'

/**
 * tIPC 的 Client
 */
export const client = createClient<Router>({
  ipcInvoke: window.electron.ipcRenderer.invoke,
})

export const handlers = createEventHandlers<RendererHandlers>({
  on: window.electron.ipcRenderer.on,
  send: window.electron.ipcRenderer.send,
})
