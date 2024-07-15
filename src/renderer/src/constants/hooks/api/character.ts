import {
  getCharacterDetailById,
  getSubjectCharactersById,
} from '@renderer/constants/fetch/api/character'
import { useQueryOptionalAuth } from '@renderer/constants/hooks/factory'
import { sortCharacterByRelation } from '@renderer/constants/transformer/api'
import { CharacterId, SubjectId } from '@renderer/constants/types/bgm'
import { useQuery } from '@tanstack/react-query'

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
    select: sortCharacterByRelation(),
  })

export const useQueryCharacterDetailByID = ({ id }: { id: CharacterId }) =>
  useQuery({
    queryFn: () => getCharacterDetailById({ id }),
    queryKey: ['characterDetail', id],
  })
