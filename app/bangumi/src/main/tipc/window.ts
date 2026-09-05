import { t } from '@main/tipc/_init'
import { BrowserWindow } from 'electron'
import { updateWindowsControls } from '../windows-controls'

export const window = {
  setWindowControlsTheme: t.procedure.input<{ dark: boolean }>().action(async ({ input }) => {
    updateWindowsControls(input.dark)
  }),
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
