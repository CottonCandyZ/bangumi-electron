import { getPersonDetailById, getSubjectPersonsById } from '@renderer/data/fetch/api/person'
import { useQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { PersonId, SubjectId } from '@renderer/data/types/bgm'
import { useQuery } from '@tanstack/react-query'

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
    queryFn: getSubjectPersonsById,
    queryKey: ['subject-persons'],
    queryProps: { id },
    enabled: enabled,
  })

export const useQueryPersonsById = ({
  id,
  enabled,
}: {
  id: PersonId | undefined
  enabled?: boolean
}) =>
  useQuery({
    queryFn: () => getPersonDetailById({ id }),
    queryKey: ['PersonDetail', id],
    enabled: enabled,
  })
