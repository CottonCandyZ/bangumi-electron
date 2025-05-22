import {
  getCharacterDetailById,
  getSubjectCharactersById,
} from '@renderer/data/fetch/api/character'
import { useAuthSuspenseQuery } from '@renderer/data/hooks/factory'
import { sortCharacterByRelation } from '@renderer/data/transformer/api'
import { CharacterId, SubjectId } from '@renderer/data/types/bgm'
import { useQuery } from '@tanstack/react-query'

/**
 * 使用 id 获得 Subject 相关的角色信息
 */
export const useQuerySubjectCharacters = ({ id }: { id: SubjectId }) =>
  useAuthSuspenseQuery({
    queryFn: getSubjectCharactersById,
    queryKey: ['subject-characters'],
    queryProps: { id },
    select: sortCharacterByRelation(['主角', '配角', '客串']),
  })

export const useQueryCharacterDetailByID = ({ id }: { id: CharacterId }) =>
  useQuery({
    queryFn: () => getCharacterDetailById({ id }),
    queryKey: ['characterDetail', id],
  })
