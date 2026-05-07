import { t } from '@main/tipc/_init'

export const env = {
  platform: t.procedure.input().action(async () => {
    return process.platform
  }),
}
