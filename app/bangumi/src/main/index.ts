import { app, BrowserWindow } from 'electron'
import { VelopackApp } from 'velopack'

VelopackApp.build().run()

const { electronApp, is, optimizer } = await import('@electron-toolkit/utils')
const { initialize } = await import('@main/init')
const { APP_PROTOCOL } = await import('@shared/constants')
const { createMainWindow } = await import('@main/window')
const { appPath, isMacOS } = await import('@main/env')
const { setupTray } = await import('@main/tray')
const { setAppQuitting } = await import('@main/app-flags')
const { registerGlobalShortcuts } = await import('@main/shortcuts')
const { toggleCommandWindow, warmCommandWindow } = await import('@main/command-window')
const { setMainWindowGetter } = await import('@main/app-context')
const { setupAutoUpdate } = await import('@main/update')

const DEV_CDP_PORT = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'

if (is.dev) {
  app.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1')
  app.commandLine.appendSwitch('remote-debugging-port', DEV_CDP_PORT)
}

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

  const getOrCreateMainWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed()) return mainWindow
    mainWindow = createMainWindow()
    return mainWindow
  }
  setMainWindowGetter(getOrCreateMainWindow)

  // 再次点击图标打开相同的实例
  app.on('second-instance', () => {
    const window = getOrCreateMainWindow()
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()

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

    mainWindow = getOrCreateMainWindow()
    setupTray(getOrCreateMainWindow)
    registerGlobalShortcuts(() => toggleCommandWindow({ mode: 'palette' }))
    warmCommandWindow()
    setupAutoUpdate()

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = getOrCreateMainWindow()
      getOrCreateMainWindow().show()
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
      setAppQuitting(true)
      const windows = BrowserWindow.getAllWindows()
      windows.forEach((window) => window.destroy())
    })
  })
}

await boot()
