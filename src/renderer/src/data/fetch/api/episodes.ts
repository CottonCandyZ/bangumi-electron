import { apiFetch, EPISODES } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { SubjectId } from '@renderer/data/types/bgm'
import { Episodes } from '@renderer/data/types/episode'
import { FetchParamError } from '@renderer/lib/utils/error'

/** 用 subjectId 获得一个 Episodes 对象
 */
export async function getEpisodesBySubjectId({
  subjectId,
  limit,
  offset,
  type,
  token,
}: {
  subjectId?: SubjectId
  limit?: number
  offset?: number
  type?: number
  token?: string
}) {
  if (!subjectId) throw new FetchParamError('未获得 id')

  const info = await apiFetch<Episodes>(EPISODES.ROOT, {
    query: {
      subject_id: subjectId,
      limit,
      offset,
      type,
    },
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}
