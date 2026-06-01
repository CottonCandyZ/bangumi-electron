import { t } from '@main/tipc/_init'
import {
  checkForUpdates,
  clearUpdateDownloads,
  downloadUpdate,
  getBuildInfo,
  getUpdateState,
  ignoreUpdate,
  installUpdate,
} from '@main/update'

export const update = {
  getBuildInfo: t.procedure.input().action(async () => {
    return getBuildInfo()
  }),
  getUpdateState: t.procedure.input().action(async () => {
    return getUpdateState()
  }),
  checkForUpdates: t.procedure.input().action(async () => {
    return await checkForUpdates()
  }),
  clearUpdateDownloads: t.procedure.input().action(async () => {
    return await clearUpdateDownloads()
  }),
  downloadUpdate: t.procedure.input().action(async () => {
    return await downloadUpdate()
  }),
  installUpdate: t.procedure.input().action(async () => {
    return installUpdate()
  }),
  ignoreUpdate: t.procedure.input<{ version?: string }>().action(async ({ input }) => {
    return ignoreUpdate(input.version)
  }),
}
