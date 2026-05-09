import {
  getCharacterCommentsById,
  getCharacterDetailById,
  getCharacterRelatedPersonsById,
  getCharacterRelatedSubjectsById,
  getSubjectCharactersById,
} from '@renderer/data/fetch/api/character'
import { useAuthQuery } from '@renderer/data/hooks/factory'
import { sortCharacterByRelation } from '@renderer/data/transformer/api'
import { CharacterId, SubjectId } from '@renderer/data/types/bgm'
import { useQuery } from '@tanstack/react-query'

/**
 * 使用 id 获得 Subject 相关的角色信息
 */
export const useQuerySubjectCharacters = ({
  id,
  needKeepPreviousData,
}: {
  id: SubjectId
  needKeepPreviousData?: boolean
}) =>
  useAuthQuery({
    queryFn: getSubjectCharactersById,
    queryKey: ['subject-characters'],
    queryProps: { id },
    select: sortCharacterByRelation(['主角', '配角', '客串']),
    needKeepPreviousData,
  })

export const useQueryCharacterDetailByID = ({ id }: { id: CharacterId }) =>
  useQuery({
    queryFn: () => getCharacterDetailById({ id }),
    queryKey: ['characterDetail', id],
  })

/**
 * 使用 id 获得角色出场作品
 */
export const useQueryCharacterRelatedSubjects = ({
  id,
  enabled,
}: {
  id: CharacterId
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getCharacterRelatedSubjectsById,
    queryKey: ['character-related-subjects'],
    queryProps: { id },
    enabled,
  })

/**
 * 使用 id 获得角色关联人物
 */
export const useQueryCharacterRelatedPersons = ({
  id,
  enabled,
}: {
  id: CharacterId
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getCharacterRelatedPersonsById,
    queryKey: ['character-related-persons'],
    queryProps: { id },
    enabled,
  })

/**
 * 使用 id 获得角色吐槽箱
 */
export const useQueryCharacterComments = ({
  id,
  enabled,
}: {
  id: CharacterId
  enabled?: boolean
}) =>
  useQuery({
    queryFn: () => getCharacterCommentsById({ id }),
    queryKey: ['character-comments', id],
    enabled,
  })
