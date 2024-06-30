import { createClient } from '@egoist/tipc/renderer'
import { Router } from 'src/main/tipc'

/**
 * tIPC 的 Client
 */
export const client = createClient<Router>({
  ipcInvoke: window.electron.ipcRenderer.invoke,
})
