import { dbIPC } from '@main/tipc/db'
import { env } from '@main/tipc/env'
import { loggerIPC } from '@main/tipc/logger'
import { utils } from '@main/tipc/utils'
import { window } from '@main/tipc/window'
import { command } from '@main/tipc/command'
import { update } from '@main/tipc/update'

export const router = {
  ...window,
  ...env,
  ...utils,
  ...command,
  ...update,
  ...loggerIPC,
  ...dbIPC,
}

export type Router = typeof router
