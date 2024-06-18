import { tipc } from '@egoist/tipc/main'
import { safeStorage, session } from 'electron'
import Store from 'electron-store'
const t = tipc.create()

export interface token {
  access_token: string
  refresh_token: string
  expires_in: number
}

const store = new Store()
export const router = {
  saveAccessToken: t.procedure.input<token>().action(async ({ input }) => {
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
  readAccessToken: t.procedure.action(async () => {
    const encrypted_token = store.get('token') as {
      encrypted_access_token: string
      encrypted_refresh_token: string
      expires_in: number
    }
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
  getCookie: t.procedure.input<Electron.CookiesGetFilter>().action(async ({ input }) => {
    return await session.defaultSession.cookies.get(input)
  }),
  removeCookie: t.procedure.input<{ url: string; name: string }>().action(async ({ input }) => {
    return await session.defaultSession.cookies.remove(input.url, input.name)
  }),
  setCookie: t.procedure.input<Electron.CookiesSetDetails>().action(async ({ input }) => {
    return await session.defaultSession.cookies.set(input)
  }),
}

export type Router = typeof router
