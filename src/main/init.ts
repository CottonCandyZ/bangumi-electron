import { registerIpcMain } from '@egoist/tipc/main'
import { router } from './tipc'
import { app } from 'electron'
import { getIconPath } from '../main/helper'
export function initialize() {
  // URI scheme
  // if (process.defaultApp) {
  //   if (process.argv.length >= 2) {
  //     app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
  //       path.resolve(process.argv[1]),
  //     ])
  //   }
  // } else {
  //   app.setAsDefaultProtocolClient(APP_PROTOCOL)
  // }

  registerIpcMain(router)

  if (app.dock) {
    app.dock.setIcon(getIconPath())
  }

  // appearance settings
  // const appearance = store.get("appearance")
  // if (appearance && ["light", "dark", "system"].includes(appearance)) {
  //   nativeTheme.themeSource = appearance
  // }

  // context menu register here...
}
