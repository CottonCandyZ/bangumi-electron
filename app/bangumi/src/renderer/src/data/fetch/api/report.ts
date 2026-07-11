import { NEXT_REPORT, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'

export type ReportType = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
export type ReportReason = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 99
export type CreateReportInput = {
  type: ReportType
  id: number
  value: ReportReason
  comment?: string
}

export function createReport(input: CreateReportInput) {
  return nextFetchWithOptionalAuth<{ message: string }>(NEXT_REPORT, {
    method: 'POST',
    body: input,
  })
}
