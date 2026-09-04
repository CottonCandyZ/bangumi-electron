import { client } from '@renderer/lib/client'
import {
  apiFetchWithOptionalAuth,
  EPISODES,
  nextFetch,
  NEXT_EPISODES,
} from '@renderer/data/fetch/config'
import { SubjectId } from '@renderer/data/types/bgm'
import { Comment } from '@renderer/data/types/comment'
import { Episode, Episodes } from '@renderer/data/types/episode'

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
  const info = await apiFetchWithOptionalAuth<Episodes>(EPISODES.ROOT, {
    query: {
      subject_id: subjectId,
      limit,
      offset,
      type,
    },
  })
  return info
}

/**
 * 用 episodeId 获得章节详情，optional auth
 */
export async function getEpisodeById({ episodeId }: { episodeId: string }) {
  if (!navigator.onLine) {
    const local = await client.collectionEpisodeResource({ episodeId: Number(episodeId) })
    if (local) return local
    throw new Error('这个章节尚未缓存，请联网后再试')
  }
  return apiFetchWithOptionalAuth<Episode>(EPISODES.BY_ID(episodeId))
}

/**
 * 从 private p1 API 获得章节吐槽箱
 */
export function getEpisodeCommentsById({ episodeId }: { episodeId: string }) {
  return nextFetch<Comment[]>(NEXT_EPISODES.COMMENTS_BY_ID(episodeId))
}
