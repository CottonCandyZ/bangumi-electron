import { t } from '@main/tipc/_init'
import { BrowserWindow } from 'electron'
import { setWindowTheme } from '../window-theme'

export const window = {
  setWindowTheme: t.procedure
    .input<{ source: 'light' | 'dark' | 'system' }>()
    .action(async ({ input }) => setWindowTheme(input.source)),
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
