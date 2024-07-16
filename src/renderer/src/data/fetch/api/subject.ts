import { SUBJECTS, apiFetch } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubject, Subject } from '@renderer/data/types/subject'
import { FetchParamError } from '@renderer/lib/utils/error'

/**
 * 从 v0 获得 subject 的基础信息
 */
export async function getSubjectById({ id, token }: { id?: SubjectId; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<Subject>(SUBJECTS.BY_ID(id.toString()), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}

/**
 * 从 v0 获得 subject 相关的 subjects
 */
export async function getRelatedSubjects({ id, token }: { id?: SubjectId; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<RelatedSubject[]>(SUBJECTS.RELATED_SUBJECT_BY_ID(id.toString()), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}
