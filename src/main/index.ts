import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { initialize } from '@main/init'
import { APP_PROTOCOL } from '@shared/constants'
import { createMainWindow } from '@main/window'
import { appPath, isMacOS } from '@main/env'

async function boot() {
  // dev 和 prod 的位置
  appPath()

  // 确保只有一个实例
  const getTheLock = app.requestSingleInstanceLock()
  if (!getTheLock) {
    app.quit()
    return
  }

  let mainWindow: BrowserWindow

  await initialize()

  // 再次点击图标打开相同的实例
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    // URI scheme
    // const url = commandLine.pop()
    // if (url) {
    //   handleOpen(url)
    // }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // set notification
    electronApp.setAppUserModelId(`re.${APP_PROTOCOL}`)

    await import('./session')

    mainWindow = createMainWindow()

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
      }

      if (mainWindow) mainWindow.show()
    })

    // Quit when all windows are closed, except on  macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
      if (!isMacOS) {
        app.quit()
      }
    })

    app.on('before-quit', () => {
      const windows = BrowserWindow.getAllWindows()
      windows.forEach((window) => window.destroy())
    })
  })
}

await boot()
