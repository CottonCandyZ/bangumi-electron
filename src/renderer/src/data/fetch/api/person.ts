import { apiFetch, PERSONS, SUBJECTS } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { PersonId, SubjectId } from '@renderer/data/types/bgm'
import { Person, PersonGrid } from '@renderer/data/types/person'
import { FetchParamError } from '@renderer/lib/utils/error'

/**
 * 从 v0 获得 subject 相关的人物信息
 */
export async function getSubjectPersonsById({ id, token }: { id?: SubjectId; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<PersonGrid[]>(SUBJECTS.PERSONS_BY_ID(id.toString()), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}

export async function getPersonDetailById({ id }: { id?: PersonId }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<Person>(PERSONS.BY_ID(id.toString()))
  return info
}
