import { SUBJECTS, apiFetch } from '@renderer/constants/fetch/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'
import { SubjectId } from '@renderer/constants/types/bgm'
import { Character } from '@renderer/constants/types/character'
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
