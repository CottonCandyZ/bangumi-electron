import {
  CHARACTERS,
  NEXT_CHARACTERS,
  SUBJECTS,
  apiFetch,
  apiFetchWithOptionalAuth,
  nextFetch,
} from '@renderer/data/fetch/config/'
import { CharacterId, SubjectId } from '@renderer/data/types/bgm'
import {
  Character,
  CharacterDetail,
  CharacterRelatedPerson,
  CharacterRelatedSubject,
} from '@renderer/data/types/character'
import type { SlimIndex } from '@renderer/data/types/index'
import { PersonComment } from '@renderer/data/types/person'
import type { P1Page } from '@renderer/data/types/subject'

/**
 * 从 v0 获得 subject 相关的角色信息
 */
export function getSubjectCharactersById({ id }: { id: SubjectId }) {
  return apiFetchWithOptionalAuth<Character[]>(SUBJECTS.CHARACTERS_BY_ID(id.toString()))
}

/**
 * 从 v0 获得 Character 的详细信息
 * 这个接口无需鉴权
 */
export function getCharacterDetailById({ id }: { id: CharacterId }) {
  return apiFetch<CharacterDetail>(CHARACTERS.BY_ID(id.toString()))
}

/**
 * 从 v0 获得角色出场作品
 */
export function getCharacterRelatedSubjectsById({ id }: { id: CharacterId }) {
  return apiFetchWithOptionalAuth<CharacterRelatedSubject[]>(
    CHARACTERS.SUBJECTS_BY_ID(id.toString()),
  )
}

/**
 * 从 v0 获得角色关联人物
 */
export function getCharacterRelatedPersonsById({ id }: { id: CharacterId }) {
  return apiFetchWithOptionalAuth<CharacterRelatedPerson[]>(CHARACTERS.PERSONS_BY_ID(id.toString()))
}

/**
 * 从 private p1 API 获得角色吐槽箱
 */
export function getCharacterCommentsById({ id }: { id: CharacterId }) {
  return nextFetch<PersonComment[]>(NEXT_CHARACTERS.COMMENTS_BY_ID(id.toString()))
}

/**
 * 从 private p1 API 获得角色关联目录
 */
export function getCharacterIndexesById({
  id,
  limit,
  offset,
}: {
  id: CharacterId
  limit?: number
  offset: number
}) {
  return nextFetch<P1Page<SlimIndex>>(NEXT_CHARACTERS.INDEXES_BY_ID(id.toString()), {
    query: {
      limit,
      offset,
    },
  })
}
