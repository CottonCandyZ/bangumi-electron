import { getSubjectById } from '@renderer/data/fetch/api/subject'
import { insertSubjectInfo, readSubjectInfoById } from '@renderer/data/fetch/db/subject'
import { useDBQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'

/**
 * 使用 id 获得 Subject 的基础信息，走 v0 接口
 */
export const useSubjectInfoQuery = ({
  subjectId: id,
  enabled,
  needKeepPreviousData,
}: {
  subjectId: SubjectId | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useDBQueryOptionalAuth({
    apiQueryFn: getSubjectById,
    apiParams: { id },
    dbQueryFn: readSubjectInfoById,
    dbParams: { id },
    queryKey: ['subject-info'],
    updateDB: insertSubjectInfo,
    enabled,
    needKeepPreviousData,
  })
