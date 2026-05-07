import { safeStorage, session } from 'electron'
import { t } from '@main/tipc/_init'

export const utils = {
  getSafeStorageEncrypted: t.procedure.input<{ origin: string[] }>().action(async ({ input }) => {
    return input.origin.map((item) => safeStorage.encryptString(item).toString('base64'))
  }),
  getSafeStorageDecrypted: t.procedure
    .input<{ encrypted: string[] }>()
    .action(async ({ input }) => {
      return input.encrypted.map((item) => safeStorage.decryptString(Buffer.from(item, 'base64')))
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
