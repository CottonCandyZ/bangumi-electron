import { t } from '@main/tipc/_init'
import { BrowserWindow } from 'electron'

export const window = {
  closeCurrentWindow: t.procedure.input().action(async () => {
    BrowserWindow.getFocusedWindow()?.close()
  }),
  minimizeCurrentWindow: t.procedure.input().action(async () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  }),
  toggleMaximizeCurrentWindow: t.procedure.input().action(async () => {
    const currentWindow = BrowserWindow.getFocusedWindow()
    if (currentWindow) {
      if (currentWindow.isMaximized()) currentWindow.unmaximize()
      else currentWindow.maximize()
    }
  }),
}
