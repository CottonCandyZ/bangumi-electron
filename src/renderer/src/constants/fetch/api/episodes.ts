import { apiFetch, EPISODES } from '@renderer/constants/fetch/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'
import { SubjectId } from '@renderer/constants/types/bgm'
import { Episodes } from '@renderer/constants/types/episode'
import { FetchParamError } from '@renderer/lib/utils/error'

/** 用 subjectId 获得一个 Episodes 对象
 */
export async function getEpisodesBySubjectId({
  id,
  limit,
  offset,
  type,
  token,
}: {
  id?: SubjectId
  limit?: number
  offset?: number
  type?: number
  token?: string
}) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<Episodes>(EPISODES.ROOT, {
    query: {
      subject_id: id,
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
