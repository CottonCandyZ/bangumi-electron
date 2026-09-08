import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { getRendererHandlers } from '@egoist/tipc/main'
import { getOrCreateMainWindowFromContext } from './app-context'
import { isAppQuitting } from './app-flags'
import type { RendererHandlers } from './tipc/renderer-handlers'
import type { ReplyComposerContent } from '../shared/reply'

let replyWindow: BrowserWindow | null = null
let content: ReplyComposerContent | null = null

export function getReplyWindowContent() {
  return content
}

export async function openReplyWindow(next: ReplyComposerContent) {
  if (content && replyWindow && !replyWindow.isDestroyed()) {
    replyWindow.show()
    replyWindow.focus()
    return false
  }
  content = next
  const window = new BrowserWindow({
    width: 640,
    height: 800,
    minWidth: 380,
    minHeight: 480,
    title: '回复',
    show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: join(__dirname, '../preload/index.mjs'), sandbox: false },
  })
  replyWindow = window
  window.on('close', (event) => {
    if (!isAppQuitting() && content) {
      event.preventDefault()
      window.hide()
    }
  })
  window.on('closed', () => {
    if (replyWindow === window) replyWindow = null
  })
  try {
    if (is.dev && process.env.ELECTRON_RENDERER_URL)
      await window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/reply-window`)
    else await window.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/reply-window' })
    window.show()
    return true
  } catch (error) {
    content = null
    window.destroy()
    throw error
  }
}

export function updateReplyWindowDraft(draft: string) {
  if (content) content = { ...content, draft }
}

export function hideReplyWindow() {
  replyWindow?.hide()
}

export function dockReplyWindow(next: ReplyComposerContent) {
  const main = getOrCreateMainWindowFromContext()
  getRendererHandlers<RendererHandlers>(main.webContents).dockReplyComposer.send(next)
  content = null
  replyWindow?.destroy()
  if (main.isMinimized()) main.restore()
  main.show()
  main.focus()
}

export function finishReplyWindow() {
  if (content) {
    const main = getOrCreateMainWindowFromContext()
    getRendererHandlers<RendererHandlers>(main.webContents).replySubmitted.send(content.target)
  }
  content = null
  replyWindow?.destroy()
}

export function focusReplyWindow() {
  if (!content || !replyWindow || replyWindow.isDestroyed()) return false
  if (replyWindow.isMinimized()) replyWindow.restore()
  replyWindow.show()
  replyWindow.focus()
  return true
}
