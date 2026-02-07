import { dbIPC } from '@main/tipc/db'
import { env } from '@main/tipc/env'
import { loggerIPC } from '@main/tipc/logger'
import { utils } from '@main/tipc/utils'
import { window } from '@main/tipc/window'

export const router = {
  ...window,
  ...env,
  ...utils,
  ...loggerIPC,
  ...dbIPC,
}

export type Router = typeof router
