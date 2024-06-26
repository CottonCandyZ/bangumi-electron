import { SUBJECTS, apiFetch } from '@renderer/constants/fetch/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'
import { SubjectId } from '@renderer/constants/types/bgm'
import { Subject } from '@renderer/constants/types/subject'
import { FetchParamError } from '@renderer/lib/utils/error'

/**
 * 从 v0 获得 subject 的基础信息
 *
 * @returns R18 内容返回空，成功了直接返回
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
