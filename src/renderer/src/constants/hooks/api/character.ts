import { getSubjectCharactersById } from '@renderer/constants/fetch/api/character'
import { useQueryOptionalAuth } from '@renderer/constants/hooks/factory'
import { SubjectId } from '@renderer/constants/types/bgm'

/**
 * 使用 id 获得 Subject 相关的角色信息
 */
export const useQuerySubjectCharacters = ({
  id,
  enabled,
}: {
  id: SubjectId | undefined
  enabled?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getSubjectCharactersById,
    queryKey: ['subject-characters'],
    props: { id },
    enabled: enabled,
  })
