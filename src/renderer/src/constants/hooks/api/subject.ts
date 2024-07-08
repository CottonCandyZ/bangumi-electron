import { getSubjectById } from '@renderer/constants/fetch/api/subject'
import { useQueryOptionalAuth } from '@renderer/constants/hooks/factory'
import { SubjectId } from '@renderer/constants/types/bgm'

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
