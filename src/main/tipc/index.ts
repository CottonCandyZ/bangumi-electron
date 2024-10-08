import { tipc } from '@egoist/tipc/main'
import { BrowserWindow, safeStorage, session } from 'electron'
import { store } from '../lib/store'

const t = tipc.create()

export interface Token {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface loginInfo {
  email: string
  password: string
}

export const router = {
  setAccessToken: t.procedure.input<Token>().action(async ({ input }) => {
    const encrypted_access_token = safeStorage.encryptString(input.access_token).toString('base64')
    const encrypted_refresh_token = safeStorage
      .encryptString(input.refresh_token)
      .toString('base64')
    store.set('token', {
      encrypted_access_token,
      encrypted_refresh_token,
      expires_in: input.expires_in,
    })
  }),
  getAccessToken: t.procedure.action(async () => {
    const encrypted_token = store.get('token') as {
      encrypted_access_token: string
      encrypted_refresh_token: string
      expires_in: number
    }
    if (!encrypted_token) return null
    const [access_token, refresh_token] = await Promise.all([
      safeStorage.decryptString(Buffer.from(encrypted_token.encrypted_access_token, 'base64')),
      safeStorage.decryptString(Buffer.from(encrypted_token.encrypted_refresh_token, 'base64')),
    ])
    return {
      access_token,
      refresh_token,
      expires_in: encrypted_token.expires_in,
    }
  }),
  isStoreAccessToken: t.procedure.action(async () => {
    return store.get('token')
  }),
  deleteAccessToken: t.procedure.action(async () => {
    store.delete('token')
  }),
  setLoginInfo: t.procedure.input<loginInfo>().action(async ({ input }) => {
    const encrypted_email = safeStorage.encryptString(input.email).toString('base64')
    const encrypted_password = safeStorage.encryptString(input.password).toString('base64')
    store.set('loginInfo', {
      encrypted_email,
      encrypted_password,
    })
  }),
  getLoginInfo: t.procedure.action(async () => {
    const encrypted_token = store.get('token') as {
      encrypted_email: string
      encrypted_password: string
    }
    const [email, password] = await Promise.all([
      safeStorage.decryptString(Buffer.from(encrypted_token.encrypted_email, 'base64')),
      safeStorage.decryptString(Buffer.from(encrypted_token.encrypted_password, 'base64')),
    ])
    return {
      email,
      password,
    }
  }),
  getCookie: t.procedure.input<Electron.CookiesGetFilter>().action(async ({ input }) => {
    return await session.defaultSession.cookies.get(input)
  }),
  removeCookie: t.procedure.input<{ url: string; name: string }>().action(async ({ input }) => {
    return await session.defaultSession.cookies.remove(input.url, input.name)
  }),
  setCookie: t.procedure.input<Electron.CookiesSetDetails>().action(async ({ input }) => {
    return await session.defaultSession.cookies.set(input)
  }),
  closeCurrentWindow: t.procedure.input().action(async () => {
    BrowserWindow.getFocusedWindow()?.close()
  }),
  minimizeCurrentWindow: t.procedure.input().action(async () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  }),
  toggleMaximizeCurrentWindow: t.procedure.input().action(async () => {
    const currentWindow = BrowserWindow.getFocusedWindow()
    if (currentWindow) {
      if (currentWindow.isMaximized()) currentWindow.unmaximize()
      else currentWindow.maximize()
    }
  }),
  platform: t.procedure.input().action(async () => {
    return process.platform
  }),
}

export type Router = typeof router
