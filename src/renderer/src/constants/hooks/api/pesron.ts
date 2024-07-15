import { getSubjectPPersonsById } from '@renderer/constants/fetch/api/person'
import { useQueryOptionalAuth } from '@renderer/constants/hooks/factory'
import { SubjectId } from '@renderer/constants/types/bgm'

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
