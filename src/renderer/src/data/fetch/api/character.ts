import { CHARACTERS, SUBJECTS, apiFetch } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { CharacterId, SubjectId } from '@renderer/data/types/bgm'
import { Character, CharacterDetail } from '@renderer/data/types/character'
import { FetchParamError } from '@renderer/lib/utils/error'

/**
 * 从 v0 获得 subject 相关的角色信息
 */
export async function getSubjectCharactersById({ id, token }: { id?: SubjectId; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')
  const info = await apiFetch<Character[]>(SUBJECTS.CHARACTERS_BY_ID(id.toString()), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}

/**
 * 从 v0 获得 Character 的详细信息
 */
export async function getCharacterDetailById({ id }: { id: CharacterId }) {
  const info = await apiFetch<CharacterDetail>(CHARACTERS.BY_ID(id.toString()))
  return info
}
