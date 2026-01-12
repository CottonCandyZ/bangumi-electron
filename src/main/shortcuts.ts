import { isMacOS } from '@main/env'
import { app, globalShortcut } from 'electron'

const COMMAND_PANEL_SHORTCUT = isMacOS ? 'Command+Shift+Alt+B' : 'Control+Shift+Alt+B'

export function registerGlobalShortcuts(toggleCommandWindow: () => void) {
  // TODO: move to settings: enable/disable + configurable shortcut
  // NOTE: macOS 关闭按钮会隐藏窗口但不会退出，保留全局快捷键用于随时唤起 CommandPanel。
  const ok = globalShortcut.register(COMMAND_PANEL_SHORTCUT, () => {
    toggleCommandWindow()
  })

  if (!ok) {
    console.warn(`[globalShortcut] register failed: ${COMMAND_PANEL_SHORTCUT}`)
  }

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })
}
