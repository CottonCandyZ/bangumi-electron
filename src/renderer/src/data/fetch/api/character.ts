import { CHARACTERS, SUBJECTS, apiFetchWithAuth, apiFetch } from '@renderer/data/fetch/config/'
import { CharacterId, SubjectId } from '@renderer/data/types/bgm'
import { Character, CharacterDetail } from '@renderer/data/types/character'

/**
 * 从 v0 获得 subject 相关的角色信息
 */
export function getSubjectCharactersById({ id }: { id: SubjectId }) {
  return apiFetchWithAuth<Character[]>(SUBJECTS.CHARACTERS_BY_ID(id.toString()))
}

/**
 * 从 v0 获得 Character 的详细信息
 * 这个接口无需鉴权
 */
export function getCharacterDetailById({ id }: { id: CharacterId }) {
  return apiFetch<CharacterDetail>(CHARACTERS.BY_ID(id.toString()))
}
