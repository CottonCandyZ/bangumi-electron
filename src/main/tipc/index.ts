import { dbIPC } from '@main/tipc/db'
import { env } from '@main/tipc/env'
import { utils } from '@main/tipc/utils'
import { window } from '@main/tipc/window'
import { command } from '@main/tipc/command'

export const router = {
  ...window,
  ...env,
  ...utils,
  ...command,
  ...dbIPC,
}

export type Router = typeof router
