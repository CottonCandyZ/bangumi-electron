import { store } from '@main/lib/store'
import { BrowserWindow, type BrowserWindowConstructorOptions, screen, shell } from 'electron'
import path, { join } from 'node:path'
import { getIconPath } from '@main/helper'
import { is } from '@electron-toolkit/utils'
import { getRendererHandlers } from '@egoist/tipc/main'
import { RendererHandlers } from '@main/tipc/renderer-handlers'
import { isMacOS, isWindows11 } from '@main/env'

const DEFAULT_WINDOW_SIZE = {
  width: 1100,
  height: 700,
}
const WINDOW_STORE_KEY = 'windowState'

const { platform } = process

const ensureInBounds = (value: number, size: number, max: number) => {
  if (value + size > max) {
    return Math.max(0, max - size)
  }
  return Math.max(0, value)
}

export function createWindow(
  options: {
    height: number
    width: number
  } & BrowserWindowConstructorOptions,
) {
  const { height, width, ...config } = options

  const baseWindowConfig: BrowserWindowConstructorOptions = {
    width,
    height,
    show: false,
    resizable: config?.resizable ?? true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  }

  switch (platform) {
    case 'darwin': {
      Object.assign(baseWindowConfig, {
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 5, y: 4 },
        // vibrancy: 'under-window',
        // visualEffectState: 'active',
        // transparent: true,
      } as BrowserWindowConstructorOptions)
      break
    }

    case 'win32': {
      Object.assign(baseWindowConfig, {
        icon: getIconPath(),
        titleBarStyle: 'hidden',
        frame: true,
      } as BrowserWindowConstructorOptions)
      break
    }

    default: {
      baseWindowConfig.icon = getIconPath()
    }
  }

  const window = new BrowserWindow({
    ...baseWindowConfig,
    ...config,
  })

  const handlers = getRendererHandlers<RendererHandlers>(window.webContents)
  window.addListener('maximize', () => {
    handlers.isMaximize.send(true)
  })
  window.addListener('unmaximize', () => {
    handlers.isMaximize.send(false)
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // registerContextMenu(window)

  return window
}

export function createMainWindow() {
  const windowState = store.get(WINDOW_STORE_KEY) as {
    height: number
    width: number
    x: number
    y: number
  } | null

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const width = windowState?.width || DEFAULT_WINDOW_SIZE.width
  const height = windowState?.height || DEFAULT_WINDOW_SIZE.height

  const x =
    windowState?.x !== undefined ? ensureInBounds(windowState.x, width, screenWidth) : undefined
  const y =
    windowState?.y !== undefined ? ensureInBounds(windowState.y, height, screenHeight) : undefined

  const window = createWindow({
    width,
    height,
    x,
    y,
    minWidth: 860,
    minHeight: 380,
  })

  window.on('close', (event) => {
    if (isWindows11) {
      const windowStoreKey = Symbol.for('maximized')
      if (window[windowStoreKey]) {
        const stored = window[windowStoreKey]
        store.set(WINDOW_STORE_KEY, {
          width: stored.size[0],
          height: stored.size[1],
          x: stored.position[0],
          y: stored.position[1],
        })

        return
      }
    }

    const bounds = window.getBounds()
    store.set(WINDOW_STORE_KEY, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    })

    if (isMacOS) {
      event.preventDefault()
      if (window.isFullScreen()) {
        window.once('leave-full-screen', () => {
          window.hide()
        })
        // 先退出全屏再最小化
        window.setFullScreen(false)
      } else {
        window.hide()
      }
    }
  })

  return window
}
