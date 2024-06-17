import { ElectronAPI } from '@electron-toolkit/preload'
import { type $Fetch } from 'ofetch'
import { type token } from '../main/handle'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: (...P: Parameters<$Fetch>) => Promise<any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchRaw: (...P: Parameters<$Fetch['raw']>) => Promise<{ data: any; cookie: string[] }>
      getCookie: (P: Electron.CookiesGetFilter) => Promise<Electron.Cookie[]>
      setCookie: (P: Electron.CookiesSetDetails) => Promise<void>
      removeCookie: (url: string, name: string) => Promise<void>
      saveAccessToken: (token: token) => void
      readAccessToken: () => Promise<token>
    }
  }
}
