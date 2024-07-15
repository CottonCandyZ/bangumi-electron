import { apiFetch, SUBJECTS } from '@renderer/constants/fetch/config';
import { getAuthHeader } from '@renderer/constants/fetch/utils';
import { SubjectId } from '@renderer/constants/types/bgm';
import { PersonGrid } from '@renderer/constants/types/person'
import { FetchParamError } from '@renderer/lib/utils/error'

/**
 * 从 v0 获得 subject 相关的人物信息
 */
export async function getSubjectPPersonsById({ id, token }: { id?: SubjectId; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<PersonGrid[]>(SUBJECTS.PERSONS_BY_ID(id.toString()), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}
