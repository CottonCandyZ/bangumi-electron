import { appendRendererLog, LogLevel } from '@main/lib/logger'
import { t } from '@main/tipc/_init'

export interface WriteLogInput {
  level: LogLevel
  scope?: string
  message: string
  data?: unknown
}

export const loggerIPC = {
  writeLog: t.procedure.input<WriteLogInput>().action(async ({ input }) => {
    await appendRendererLog({
      level: input.level,
      scope: input.scope ?? 'renderer',
      message: input.message,
      data: input.data,
    })
  }),
}
