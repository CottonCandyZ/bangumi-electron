import { t } from '@main/tipc/_init'
import { getOrCreateMainWindowFromContext } from '@main/app-context'
import { hideCommandWindow, markCommandOverlayReady } from '@main/command-window'
import { getRendererHandlers } from '@egoist/tipc/main'
import type { RendererHandlers } from '@main/tipc/renderer-handlers'

export const command = {
  commandOverlayReady: t.procedure.input().action(async () => {
    markCommandOverlayReady()
  }),
  hideCommandWindow: t.procedure.input().action(async () => {
    hideCommandWindow()
  }),
  openMainWindowAndNavigate: t.procedure.input<{ path: string }>().action(async ({ input }) => {
    const mainWindow = getOrCreateMainWindowFromContext()
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()

    const handlers = getRendererHandlers<RendererHandlers>(mainWindow.webContents)
    handlers.navigateTo.send({ path: input.path })
  }),
}
