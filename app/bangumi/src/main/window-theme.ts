import { nativeTheme } from 'electron'
import { JSONStore } from './lib/store'
import { isWindows } from './env'

type ThemeSource = 'light' | 'dark' | 'system'
const key = 'windowThemeSource'

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
