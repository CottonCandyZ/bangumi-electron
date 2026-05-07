import { appFolder } from '@main/constants'
import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
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

function migrateLegacyUserDataPath(nextUserDataPath: string) {
  const legacyUserDataPath = path.join(nextUserDataPath, appFolderName)
  if (!existsSync(legacyUserDataPath)) return

  mkdirSync(nextUserDataPath, { recursive: true })

  for (const fileName of ['db.json', 'store.sqlite']) {
    const legacyFilePath = path.join(legacyUserDataPath, fileName)
    const nextFilePath = path.join(nextUserDataPath, fileName)
    if (!existsSync(legacyFilePath) || existsSync(nextFilePath)) continue
    copyFileSync(legacyFilePath, nextFilePath)
  }
}

// to solve the order problem
export const appPath = () => {
  if (!pathIsInit) {
    const userDataPath = path.join(app.getPath('appData'), appFolderName)
    migrateLegacyUserDataPath(userDataPath)
    app.setPath('userData', userDataPath)
    pathIsInit = true
  }
  const get = (name: Parameters<typeof app.getPath>[0]) => {
    return app.getPath(name)
  }
  return get
}
