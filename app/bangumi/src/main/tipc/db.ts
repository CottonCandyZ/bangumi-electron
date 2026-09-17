import type { ExecuteBatchType, ExecuteType } from '@main/lib/db-operations'
import { collectionService } from '@main/collection/service'
import type { Subject } from '@shared/types/subject'
import { t } from '@main/tipc/_init'

export const dbIPC = {
  db: t.procedure.input<ExecuteType>().action(async ({ input }) => {
    return await collectionService().call('db', input)
  }),
  dbBatch: t.procedure.input<ExecuteBatchType>().action(async ({ input }) => {
    return await collectionService().call('dbBatch', input)
  }),
  dbSaveSubjects: t.procedure
    .input<Subject[]>()
    .action(({ input }) => collectionService().call('dbSaveSubjects', input)),
}
