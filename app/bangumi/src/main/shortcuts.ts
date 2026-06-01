import { app, globalShortcut } from 'electron'
import { JSONStore } from '@main/lib/store'
import { DEFAULT_APP_CONFIG, normalizeAppConfig } from '@shared/config'

const APP_CONFIG_STORE_KEY = 'appConfig'

let commandWindowToggle: (() => void) | null = null
let commandPanelShortcut: string | null = null
let willQuitRegistered = false

export function registerGlobalShortcuts(toggleCommandWindow: () => void) {
  commandWindowToggle = toggleCommandWindow

  // NOTE: macOS 关闭按钮会隐藏窗口但不会退出，保留全局快捷键用于随时唤起 CommandPanel。
  updateGlobalCommandPanelShortcut(readGlobalCommandPanelShortcut())

  if (!willQuitRegistered) {
    willQuitRegistered = true
    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
    })
  }
}

export function updateGlobalCommandPanelShortcut(hotkey: string) {
  if (commandPanelShortcut) {
    globalShortcut.unregister(commandPanelShortcut)
    commandPanelShortcut = null
  }

  const accelerator = toElectronAccelerator(hotkey)
  if (!accelerator || !commandWindowToggle) return

  const ok = globalShortcut.register(accelerator, () => {
    commandWindowToggle?.()
  })

  if (!ok) {
    console.warn(`[globalShortcut] register failed: ${accelerator}`)
    return
  }

  commandPanelShortcut = accelerator
}

function readGlobalCommandPanelShortcut() {
  return normalizeAppConfig(JSONStore.get(APP_CONFIG_STORE_KEY)).shortcuts.openCommandPanelGlobal
}

function toElectronAccelerator(hotkey: string) {
  const keys = hotkey
    .split('+')
    .map((key) => key.trim())
    .filter(Boolean)

  if (keys.length === 0) return null

  return keys
    .map((key) => {
      if (key === 'mod') return 'CommandOrControl'
      if (key === 'ctrl') return 'Control'
      if (key === 'meta') return 'Super'
      if (key === 'alt') return 'Alt'
      if (key === 'shift') return 'Shift'
      if (key === 'comma') return ','
      if (key === 'period') return '.'
      if (key === 'space') return 'Space'
      if (key.length === 1) return key.toUpperCase()

      return key || DEFAULT_APP_CONFIG.shortcuts.openCommandPanelGlobal
    })
    .join('+')
}
