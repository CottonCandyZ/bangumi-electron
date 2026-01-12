import { BrowserWindow, Menu, Tray, app, nativeImage } from 'electron'
import { getIconPath } from '@main/helper'
import { isWindows } from '@main/env'
import { setAppQuitting } from '@main/app-flags'

let tray: Tray | null = null

export function setupTray(getOrCreateMainWindow: () => BrowserWindow) {
  // TODO: move to settings: enable background mode + tray
  // NOTE: macOS 也建议提供状态栏(Tray)图标，但通常需要 template icon（适配深浅色）。
  //       当前先只在 Windows 开启，macOS 后续补齐图标资源后再打开。
  if (!isWindows) return null
  if (tray) return tray

  const image = nativeImage.createFromPath(getIconPath())
  tray = new Tray(image)
  tray.setToolTip(app.getName())

  const buildMenu = () => {
    const win = getOrCreateMainWindow()
    const isVisible = win.isVisible()
    return Menu.buildFromTemplate([
      {
        label: isVisible ? '隐藏' : '显示',
        click: () => {
          const window = getOrCreateMainWindow()
          if (window.isVisible()) window.hide()
          else {
            if (window.isMinimized()) window.restore()
            window.show()
            window.focus()
          }
          refreshMenu()
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

  const refreshMenu = () => {
    tray?.setContextMenu(buildMenu())
  }

  tray.on('click', () => {
    const window = getOrCreateMainWindow()
    if (window.isVisible()) window.hide()
    else {
      if (window.isMinimized()) window.restore()
      window.show()
      window.focus()
    }
    refreshMenu()
  })

  tray.on('right-click', () => {
    refreshMenu()
    tray?.popUpContextMenu()
  })

  refreshMenu()

  return tray
}
