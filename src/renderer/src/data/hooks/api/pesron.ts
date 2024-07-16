import { getSubjectPPersonsById } from '@renderer/data/fetch/api/person'
import { useQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'

// 暂时用不到
/**
 * 使用 id 获得 Subject 相关的人物信息
 */
export const useQuerySubjectPersons = ({
  id,
  enabled,
}: {
  id: SubjectId | undefined
  enabled?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getSubjectPPersonsById,
    queryKey: ['subject-persons'],
    props: { id },
    enabled: enabled,
  })
