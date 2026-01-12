import type { BrowserWindow } from 'electron'

const MAIN_WINDOW_GETTER_KEY = Symbol.for('bangumi-electron.getOrCreateMainWindow')

export function setMainWindowGetter(getter: () => BrowserWindow) {
  ;(globalThis as Record<symbol, unknown>)[MAIN_WINDOW_GETTER_KEY] = getter
}

export function getOrCreateMainWindowFromContext(): BrowserWindow {
  const getter = (globalThis as Record<symbol, unknown>)[MAIN_WINDOW_GETTER_KEY] as
    | (() => BrowserWindow)
    | undefined
  if (!getter) {
    throw new Error('Main window getter is not set')
  }
  return getter()
}
