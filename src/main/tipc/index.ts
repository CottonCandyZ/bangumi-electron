import { dbIPC } from '@main/tipc/db'
import { env } from '@main/tipc/env'
import { modifySession } from '@main/tipc/session'
import { window } from '@main/tipc/window'

export const router = {
  ...window,
  ...env,
  ...modifySession,
  ...dbIPC,
}

export type Router = typeof router
