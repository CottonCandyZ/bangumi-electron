import { getSubjectById } from '@renderer/data/fetch/api/subject'
import { useQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'

/**
 * 使用 id 获得 Subject 的基础信息，走 v0 接口
 */
export const useQuerySubjectInfo = ({
  id,
  enabled,
}: {
  id: SubjectId | undefined
  enabled?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getSubjectById,
    queryKey: ['subject-info'],
    props: { id },
    enabled: enabled,
  })
