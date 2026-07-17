import { getIconPath } from '@main/helper'
import { t } from '@main/tipc/_init'
import { BrowserWindow } from 'electron'

const VERIFICATION_URL = 'https://bgm.tv/anime/browser/?sort=trends'
const VERIFICATION_TIMEOUT_MS = 5 * 60 * 1000

let verificationWindow: BrowserWindow | null = null
let verificationPromise: Promise<void> | null = null

export const webVerificationIPC = {
  requestBangumiWebVerification: t.procedure.input().action(async () => {
    await requestBangumiWebVerification()
  }),
}

function requestBangumiWebVerification() {
  if (verificationPromise) {
    verificationWindow?.show()
    verificationWindow?.focus()
    return verificationPromise
  }

  verificationPromise = createBangumiWebVerificationWindow().finally(() => {
    verificationPromise = null
    verificationWindow = null
  })
  return verificationPromise
}

function createBangumiWebVerificationWindow() {
  return new Promise<void>((resolve, reject) => {
    const parent = BrowserWindow.getFocusedWindow() ?? undefined
    const window = new BrowserWindow({
      width: 860,
      height: 720,
      minWidth: 420,
      minHeight: 520,
      parent,
      modal: !!parent,
      title: 'Bangumi 网页验证',
      autoHideMenuBar: true,
      icon: getIconPath(),
      webPreferences: {
        sandbox: true,
      },
    })
    verificationWindow = window

    let settled = false
    const timeout = setTimeout(() => {
      finish(new Error('Bangumi 网页验证超时。'))
    }, VERIFICATION_TIMEOUT_MS)

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (!window.isDestroyed()) window.close()
      if (error) {
        reject(error)
        return
      }
      resolve()
    }

    window.webContents.on('did-finish-load', () => {
      void window.webContents
        .executeJavaScript("Boolean(document.querySelector('.subjectCover.cover.ll'))", true)
        .then((hasTrendingSubjects: boolean) => {
          if (hasTrendingSubjects) finish()
        })
        .catch(() => {
          // The challenge can navigate while the previous document is being inspected.
        })
    })

    window.webContents.on('will-navigate', (event, url) => {
      const target = new URL(url)
      const allowedHost =
        target.hostname === 'bgm.tv' || target.hostname.endsWith('.cloudflare.com')
      if (target.protocol === 'https:' && allowedHost) return
      event.preventDefault()
    })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.once('closed', () => {
      finish(new Error('Bangumi 网页验证已取消。'))
    })
    window.loadURL(VERIFICATION_URL).catch((error: unknown) => {
      finish(error instanceof Error ? error : new Error('无法打开 Bangumi 网页验证。'))
    })
  })
}
