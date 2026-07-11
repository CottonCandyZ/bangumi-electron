import { createReport } from '@renderer/data/fetch/api/report'
import { useMutationMustAuth } from '@renderer/data/hooks/factory'

export const useCreateReportMutation = () =>
  useMutationMustAuth({ mutationFn: createReport, mutationKey: ['create-report'] })
