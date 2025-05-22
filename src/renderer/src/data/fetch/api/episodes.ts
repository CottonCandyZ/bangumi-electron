import { apiFetchWithAuth, EPISODES } from '@renderer/data/fetch/config'
import { SubjectId } from '@renderer/data/types/bgm'
import { Episodes } from '@renderer/data/types/episode'

/**
 * 用 subjectId 获得一个 Episodes 对象，
 * optional auth
 */
export async function getEpisodesBySubjectId({
  subjectId,
  limit,
  offset,
  type,
}: {
  subjectId: SubjectId
  limit?: number
  offset?: number
  type?: number
}) {
  const info = await apiFetchWithAuth<Episodes>(EPISODES.ROOT, {
    query: {
      subject_id: subjectId,
      limit,
      offset,
      type,
    },
  })
  return info
}
