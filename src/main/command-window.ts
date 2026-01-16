import { BrowserWindow, screen } from 'electron'
import path, { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { getIconPath } from '@main/helper'
import { getRendererHandlers } from '@egoist/tipc/main'
import type { RendererHandlers } from '@main/tipc/renderer-handlers'
import { isAppQuitting } from '@main/app-flags'
import {
  COMMAND_WINDOW_INPUT_HEIGHT,
  COMMAND_WINDOW_LIST_HEIGHT_RATIO,
  COMMAND_WINDOW_LIST_MAX_HEIGHT,
  COMMAND_WINDOW_MARGIN,
  COMMAND_WINDOW_MAX_WIDTH,
  COMMAND_WINDOW_VERTICAL_OFFSET_RATIO,
} from '@shared/constants'

let commandWindow: BrowserWindow | null = null
let commandOverlayReady = false
let pendingOpen: { mode?: 'palette' | 'subject-search' } | null = null
let pendingShow = false
let commandWindowPresented = false
let commandWindowShownOnce = false
let primingHideTimer: ReturnType<typeof setTimeout> | null = null
const keepCommandWindowVisible = process.platform === 'win32'

function loadCommandWindowContents(window: BrowserWindow) {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/command`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/command' })
  }
}

function getDesiredCommandWindowBounds() {
  const point = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(point)
  const workArea = display.workArea

  const listHeight = Math.min(
    Math.round(workArea.height * COMMAND_WINDOW_LIST_HEIGHT_RATIO),
    COMMAND_WINDOW_LIST_MAX_HEIGHT,
  )
  const contentHeight = COMMAND_WINDOW_INPUT_HEIGHT + listHeight
  const contentWidth = Math.min(
    COMMAND_WINDOW_MAX_WIDTH,
    Math.max(0, workArea.width - COMMAND_WINDOW_MARGIN * 2),
  )

  const windowWidth = Math.min(workArea.width, Math.round(contentWidth + COMMAND_WINDOW_MARGIN * 2))
  const windowHeight = Math.min(
    workArea.height,
    Math.round(contentHeight + COMMAND_WINDOW_MARGIN * 2),
  )

  const x = Math.round(workArea.x + (workArea.width - windowWidth) / 2)
  const y = Math.round(
    workArea.y + (workArea.height - windowHeight) * COMMAND_WINDOW_VERTICAL_OFFSET_RATIO,
  )

  return {
    x,
    y,
    width: windowWidth,
    height: windowHeight,
  }
}

function updateCommandWindowBounds(window: BrowserWindow) {
  const desired = getDesiredCommandWindowBounds()
  const current = window.getBounds()
  if (
    current.x === desired.x &&
    current.y === desired.y &&
    current.width === desired.width &&
    current.height === desired.height
  ) {
    return
  }
  window.setBounds(desired, false)
}

function setPresented(window: BrowserWindow, presented: boolean) {
  commandWindowPresented = presented
  if (presented) {
    window.setIgnoreMouseEvents(false)
    window.setFocusable(true)
    if (!window.isVisible()) {
      // Keep the first on-screen frame invisible to avoid flashes.
      window.setOpacity(0)
      window.showInactive()
    }
    window.setOpacity(1)
  } else {
    window.setOpacity(0)
    window.setIgnoreMouseEvents(true, { forward: true })
    window.setFocusable(false)
    if (!keepCommandWindowVisible) window.hide()
  }
}

export function getOrCreateCommandWindow() {
  if (commandWindow && !commandWindow.isDestroyed()) return commandWindow

  commandOverlayReady = false
  pendingOpen = null
  pendingShow = false
  commandWindowPresented = false
  commandWindowShownOnce = false

  const window = new BrowserWindow({
    show: false,
    opacity: 0,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    hasShadow: false,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  if (process.platform === 'darwin') {
    // Avoid a persistent "empty" transparent window showing up in Mission Control.
    window.setHiddenInMissionControl(true)
  }

  window.on('close', (event) => {
    if (!isAppQuitting()) {
      event.preventDefault()
      setPresented(window, false)
    }
  })

  window.on('blur', () => {
    if (!isAppQuitting() && commandWindowPresented) setPresented(window, false)
  })

  window.webContents.on('did-start-loading', () => {
    commandOverlayReady = false
  })

  window.webContents.on('did-finish-load', () => {
    flushPendingOpen()
  })

  // Pre-size; we will "show once" invisibly only after the overlay route reports ready,
  // to avoid first-show white flashes.
  updateCommandWindowBounds(window)
  setPresented(window, false)

  loadCommandWindowContents(window)

  commandWindow = window
  return window
}

function ensureShownOnce(window: BrowserWindow) {
  if (commandWindowShownOnce) return
  commandWindowShownOnce = true
  window.setOpacity(0)
  window.showInactive()
  if (keepCommandWindowVisible) return
  if (primingHideTimer) clearTimeout(primingHideTimer)
  primingHideTimer = setTimeout(() => {
    primingHideTimer = null
    if (window.isDestroyed()) return
    if (commandWindowPresented) return
    window.hide()
  }, 0)
}

function flushPendingOpen() {
  if (!pendingOpen) return
  if (!commandOverlayReady) return
  const win = commandWindow
  if (!win || win.isDestroyed()) return

  const handlers = getRendererHandlers<RendererHandlers>(win.webContents)
  handlers.openCommandPanel.send(pendingOpen)
  pendingOpen = null
}

export function markCommandOverlayReady() {
  commandOverlayReady = true
  const window = commandWindow
  if (pendingShow) {
    pendingShow = false
    if (window && !window.isDestroyed()) {
      setPresented(window, true)
      window.focus()
    }
  } else if (window && !window.isDestroyed()) {
    ensureShownOnce(window)
  }
  flushPendingOpen()
}

export function showCommandWindow(payload?: { mode?: 'palette' | 'subject-search' }) {
  const window = getOrCreateCommandWindow()
  updateCommandWindowBounds(window)

  pendingOpen = payload ?? { mode: 'palette' }
  if (commandOverlayReady) {
    setPresented(window, true)
    window.focus()
    flushPendingOpen()
  } else {
    // Avoid flashing an empty transparent window; show only after overlay route reports ready.
    pendingShow = true
  }
}

export function hideCommandWindow() {
  if (!commandWindow || commandWindow.isDestroyed()) return
  setPresented(commandWindow, false)
}

export function toggleCommandWindow(payload?: { mode?: 'palette' | 'subject-search' }) {
  const window = getOrCreateCommandWindow()
  if (commandWindowPresented) {
    setPresented(window, false)
  } else {
    showCommandWindow(payload)
  }
}
