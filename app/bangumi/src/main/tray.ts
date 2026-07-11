import { BrowserWindow, Menu, Tray, app, nativeImage } from 'electron'
import { getIconPath } from '@main/helper'
import { isWindows } from '@main/env'
import { isAppQuitting, setAppQuitting } from '@main/app-flags'

let tray: Tray | null = null

function isWindowPresented(window: BrowserWindow) {
  return window.isVisible() && !window.isMinimized()
}

function presentWindow(window: BrowserWindow) {
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
}

export function setupTray(getOrCreateMainWindow: () => BrowserWindow) {
  // TODO: move to settings: enable background mode + tray
  // NOTE: macOS 也建议提供状态栏(Tray)图标，但通常需要 template icon（适配深浅色）。
  //       当前先只在 Windows 开启，macOS 后续补齐图标资源后再打开。
  if (!isWindows) return null
  if (tray) return tray

  const image = nativeImage.createFromPath(getIconPath())
  tray = new Tray(image)
  tray.setToolTip(app.getName())

  let observedWindow: BrowserWindow | null = null

  const observeWindow = (window: BrowserWindow) => {
    if (window === observedWindow) return

    if (observedWindow && !observedWindow.isDestroyed()) {
      observedWindow.off('show', refreshMenu)
      observedWindow.off('hide', refreshMenu)
      observedWindow.off('minimize', refreshMenu)
      observedWindow.off('restore', refreshMenu)
    }

    observedWindow = window
    window.on('show', refreshMenu)
    window.on('hide', refreshMenu)
    window.on('minimize', refreshMenu)
    window.on('restore', refreshMenu)
    window.once('closed', () => {
      if (observedWindow === window) observedWindow = null
    })
  }

  const buildMenu = (window: BrowserWindow) => {
    return Menu.buildFromTemplate([
      {
        label: isWindowPresented(window) ? '隐藏' : '显示',
        click: () => {
          toggleMainWindow()
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          setAppQuitting(true)
          app.quit()
        },
      },
    ])
  }

  function refreshMenu() {
    if (!tray || isAppQuitting()) return
    const window = getOrCreateMainWindow()
    observeWindow(window)
    tray.setContextMenu(buildMenu(window))
  }

  function toggleMainWindow() {
    const window = getOrCreateMainWindow()
    observeWindow(window)
    if (isWindowPresented(window)) window.hide()
    else presentWindow(window)
  }

  tray.on('click', () => {
    toggleMainWindow()
  })

  tray.on('right-click', () => {
    refreshMenu()
    tray?.popUpContextMenu()
  })

  refreshMenu()

  return tray
}
