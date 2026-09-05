import { nativeTheme, type BrowserWindow } from 'electron'
import { JSONStore } from './lib/store'
import { isWindows } from './env'

type ThemeSource = 'light' | 'dark' | 'system'
const key = 'windowThemeSource'

export function getWindowTitleBarOverlay() {
  return {
    height: 32,
    // Let the Mica surface show through, instead of Windows' fixed light button face.
    color: '#00000000',
    symbolColor: nativeTheme.shouldUseDarkColors ? '#ffffff' : '#000000',
  }
}

export function syncWindowTitleBarTheme(window: BrowserWindow) {
  if (!isWindows) return
  const update = () => {
    if (!window.isDestroyed()) window.setTitleBarOverlay(getWindowTitleBarOverlay())
  }
  update()
  nativeTheme.on('updated', update)
  window.once('closed', () => nativeTheme.removeListener('updated', update))
}

export function setWindowTheme(source: ThemeSource) {
  if (!['light', 'dark', 'system'].includes(source)) throw new Error('无效的主题')
  if (!isWindows) return
  nativeTheme.themeSource = source
  if (JSONStore.get(key) !== source) JSONStore.set(key, source)
}

export function restoreWindowTheme() {
  const source = JSONStore.get(key)
  if (source === 'light' || source === 'dark' || source === 'system') setWindowTheme(source)
}
