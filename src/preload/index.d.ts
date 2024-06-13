import { ElectronAPI } from '@electron-toolkit/preload'
import { type $Fetch } from 'ofetch'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: (...P: Parameters<$Fetch['raw']>) => Promise<{ data: any; cookie: string[] }>
    }
  }
}
