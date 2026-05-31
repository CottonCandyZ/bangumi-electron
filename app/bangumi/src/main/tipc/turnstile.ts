import { BrowserWindow } from 'electron'
import { getIconPath } from '@main/helper'
import { t } from '@main/tipc/_init'

const TURNSTILE_URL = 'https://next.bgm.tv/p1/turnstile'
const TURNSTILE_REDIRECT_URI = 'chii://turnstile'
const TOKEN_TIMEOUT_MS = 120_000

export const turnstileIPC = {
  getTurnstileToken: t.procedure.input().action(async () => {
    return await requestTurnstileToken()
  }),
}

function requestTurnstileToken() {
  return new Promise<string>((resolve, reject) => {
    const parent = BrowserWindow.getFocusedWindow() ?? undefined
    const window = new BrowserWindow({
      width: 420,
      height: 520,
      parent,
      modal: !!parent,
      title: 'Bangumi 验证',
      autoHideMenuBar: true,
      icon: getIconPath(),
      webPreferences: {
        sandbox: true,
      },
    })
    let settled = false
    const timeout = setTimeout(() => {
      finish(new Error('Turnstile 验证超时。'))
    }, TOKEN_TIMEOUT_MS)
    const turnstileUrl = new URL(TURNSTILE_URL)
    turnstileUrl.searchParams.set('theme', 'auto')
    turnstileUrl.searchParams.set('redirect_uri', TURNSTILE_REDIRECT_URI)

    const finish = (value: string | Error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (!window.isDestroyed()) window.close()
      if (value instanceof Error) {
        reject(value)
        return
      }
      resolve(value)
    }
    const maybeResolveToken = (url: string) => {
      if (!url.startsWith(TURNSTILE_REDIRECT_URI)) return false
      const token = new URL(url).searchParams.get('token')
      if (!token) {
        finish(new Error('未能获取 Turnstile 令牌。'))
        return true
      }
      finish(token)
      return true
    }

    window.webContents.on('will-navigate', (event, url) => {
      if (!maybeResolveToken(url)) return
      event.preventDefault()
    })
    window.webContents.on('will-redirect', (event, url) => {
      if (!maybeResolveToken(url)) return
      event.preventDefault()
    })
    window.webContents.setWindowOpenHandler(({ url }) => {
      maybeResolveToken(url)
      return { action: 'deny' }
    })
    window.once('closed', () => {
      finish(new Error('Turnstile 验证已取消。'))
    })
    window.loadURL(turnstileUrl.toString()).catch((error: unknown) => {
      finish(error instanceof Error ? error : new Error('无法打开 Turnstile 验证。'))
    })
  })
}
