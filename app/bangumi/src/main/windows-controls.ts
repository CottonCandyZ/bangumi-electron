import { nativeTheme, type BrowserWindow } from 'electron'

const windows = new Set<BrowserWindow>()

export function windowsControlStyle(dark = nativeTheme.shouldUseDarkColors) {
  return { color: '#00000000', symbolColor: dark ? '#fafafa' : '#171717', height: 56 }
}

export function registerWindowsControls(window: BrowserWindow) {
  windows.add(window)
  window.once('closed', () => windows.delete(window))
}

export function updateWindowsControls(dark: boolean) {
  for (const window of windows) {
    if (!window.isDestroyed()) window.setTitleBarOverlay(windowsControlStyle(dark))
  }
}
