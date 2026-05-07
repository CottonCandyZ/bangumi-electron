import { execute, executeBatch, ExecuteBatchType, ExecuteType } from '@main/lib/db'
import { t } from '@main/tipc/_init'

export const dbIPC = {
  db: t.procedure.input<ExecuteType>().action(async ({ input }) => {
    return await execute(input)
  }),
  dbBatch: t.procedure.input<ExecuteBatchType>().action(async ({ input }) => {
    return await executeBatch(input)
  }),
}
