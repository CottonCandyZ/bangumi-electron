import { getPersonDetailById, getSubjectPersonsById } from '@renderer/data/fetch/api/person'
import { useAuthQuery } from '@renderer/data/hooks/factory'
import { PersonId, SubjectId } from '@renderer/data/types/bgm'
import { useQuery } from '@tanstack/react-query'

/**
 * 使用 id 获得 Subject 相关的人物信息
 * @deprecated 当前未使用，后续将删除
 */
export const useQuerySubjectPersons = ({
  id,
  enabled,
}: {
  id: SubjectId | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
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
