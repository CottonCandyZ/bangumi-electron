import { ipcMain, session, safeStorage } from 'electron'
import { ofetch } from 'ofetch'
import Store from 'electron-store'

export interface token {
  access_token: string
  refresh_token: string
  expires_in: number
}

const store = new Store()

ipcMain.handle('fetch', async (_, resource, options) => {
  const data = await ofetch(resource, options)
  return data
})

ipcMain.handle('fetchRaw', async (_, resource, options) => {
  const { _data, headers } = await ofetch.raw(resource, options)
  return { data: _data, cookie: headers.getSetCookie() }
})

ipcMain.handle('cookie-get', async (_, filter) => {
  return await session.defaultSession.cookies.get(filter)
})

ipcMain.handle('cookie-remove', async (_, url, name) => {
  return await session.defaultSession.cookies.remove(url, name)
})

ipcMain.handle('cookie-set', async (_, filter) => {
  return await session.defaultSession.cookies.set(filter)
})

ipcMain.handle('save-access-token', (_, token: token) => {
  const encrypted_access_token = safeStorage.encryptString(token.access_token).toString('base64')
  const encrypted_refresh_token = safeStorage.encryptString(token.refresh_token).toString('base64')
  store.set('token', {
    encrypted_access_token,
    encrypted_refresh_token,
    expires_in: token.expires_in,
  })
})

ipcMain.handle('read-access-token', async () => {
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
})
