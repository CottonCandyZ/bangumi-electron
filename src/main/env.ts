import { appFolder } from '../main/constants'
import { app } from 'electron'
import os from 'node:os'
import path from 'node:path'

const { platform } = process
export const isMacOS = platform === 'darwin'

export const isWindows = platform === 'win32'

export const isLinux = platform === 'linux'
export const isWindows11 = isWindows && os.version().startsWith('Windows 11')

export const isDev = process.env.NODE_ENV === 'development'

export const appFolderName = isDev ? appFolder.dev : appFolder.prod

let pathIsInit = false

// to solve the order problem
export const appPath = () => {
  if (!pathIsInit) {
    app.setPath('appData', path.join(app.getPath('appData'), appFolderName))
    pathIsInit = true
  }
  const get = (name: Parameters<typeof app.getPath>[0]) => {
    return app.getPath(name)
  }
  return get
}
