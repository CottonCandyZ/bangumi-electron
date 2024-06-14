import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  fetch: (...args) => ipcRenderer.invoke('fetch', ...args),
  fetchRaw: (...args) => ipcRenderer.invoke('fetchRaw', ...args),
  getCookie: (...args) => ipcRenderer.invoke('cookie-get', ...args),
  setCookie: (...args) => ipcRenderer.invoke('cookie-set', ...args),
  removeCookie: (...args) => ipcRenderer.invoke('cookie-remove', ...args),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
