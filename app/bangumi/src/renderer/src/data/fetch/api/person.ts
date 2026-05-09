import {
  apiFetch,
  apiFetchWithOptionalAuth,
  nextFetch,
  NEXT_PERSONS,
  PERSONS,
  SUBJECTS,
} from '@renderer/data/fetch/config/'
import { PersonId, SubjectId } from '@renderer/data/types/bgm'
import {
  Person,
  PersonComment,
  PersonGrid,
  PersonRelatedCharacter,
  PersonRelatedSubject,
} from '@renderer/data/types/person'
import { FetchParamError } from '@renderer/lib/utils/error'

/**
 * 从 v0 获得 subject 相关的人物信息
 */
export async function getSubjectPersonsById({ id }: { id?: SubjectId }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetchWithOptionalAuth<PersonGrid[]>(SUBJECTS.PERSONS_BY_ID(id.toString()))
  return info
}

/**
 * 从 v0 获得人物详情
 */
export async function getPersonDetailById({ id }: { id?: PersonId }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<Person>(PERSONS.BY_ID(id.toString()))
  return info
}

/**
 * 从 v0 获得人物参与的作品列表
 */
export async function getPersonRelatedSubjectsById({ id }: { id?: PersonId }) {
  if (!id) throw new FetchParamError('未获得 id')

  return await apiFetchWithOptionalAuth<PersonRelatedSubject[]>(
    PERSONS.SUBJECTS_BY_ID(id.toString()),
  )
}

/**
 * 从 v0 获得人物出场的角色列表
 */
export async function getPersonRelatedCharactersById({ id }: { id?: PersonId }) {
  if (!id) throw new FetchParamError('未获得 id')

  return await apiFetchWithOptionalAuth<PersonRelatedCharacter[]>(
    PERSONS.CHARACTERS_BY_ID(id.toString()),
  )
}

/**
 * 从 private p1 API 获得人物吐槽箱
 */
export async function getPersonCommentsById({ id }: { id?: PersonId }) {
  if (!id) throw new FetchParamError('未获得 id')

  return await nextFetch<PersonComment[]>(NEXT_PERSONS.COMMENTS_BY_ID(id.toString()))
}
