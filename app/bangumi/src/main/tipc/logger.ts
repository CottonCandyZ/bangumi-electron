import { appendRendererLog, exportLogs, LogLevel } from '@main/lib/logger'
import { t } from '@main/tipc/_init'
import { app, dialog } from 'electron'
import { join } from 'node:path'

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
  exportLogs: t.procedure.input().action(async () => {
    const date = new Date().toISOString().slice(0, 10)
    const result = await dialog.showSaveDialog({
      title: '导出 log',
      defaultPath: join(app.getPath('downloads'), `bangumi-electron-logs-${date}.log`),
      filters: [{ name: 'Log', extensions: ['log', 'txt'] }],
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true as const }
    }

    await exportLogs(result.filePath)
    return { canceled: false as const, filePath: result.filePath }
  }),
}
