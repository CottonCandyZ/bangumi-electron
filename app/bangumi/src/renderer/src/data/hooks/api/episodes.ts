import {
  getEpisodeById,
  getEpisodeCommentsById,
  getEpisodesBySubjectId,
} from '@renderer/data/fetch/api/episodes'
import { useAuthQuery } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'
import { useQuery } from '@tanstack/react-query'

const EPISODE_COMMENTS_STALE_TIME = 1000 * 30

/**
 * 使用 SubjectId 获得 Episodes
 *
 */
export const useEpisodesInfoBySubjectIdQuery = ({
  subjectId,
  limit = 100,
  offset = 0,
  type,
  enabled,
}: {
  subjectId: SubjectId
  limit?: number
  offset?: number
  type?: number
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getEpisodesBySubjectId,
    queryKey: ['episodes-info'],
    queryProps: { subjectId, limit, offset, type },
    enabled,
    needKeepPreviousData: true,
  })

/**
 * 使用 episodeId 获得章节详情
 */
export const useEpisodeInfoByIdQuery = ({
  episodeId,
  enabled,
}: {
  episodeId: string
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getEpisodeById,
    queryKey: ['episode-info'],
    queryProps: { episodeId },
    enabled,
  })

/**
 * 使用 episodeId 获得章节吐槽箱。p1 该接口目前返回全量数组，没有分页参数。
 */
export const useEpisodeCommentsByIdQuery = ({
  episodeId,
  enabled,
}: {
  episodeId: string
  enabled?: boolean
}) =>
  useQuery({
    queryFn: () => getEpisodeCommentsById({ episodeId }),
    queryKey: ['episode-comments', episodeId],
    enabled,
    staleTime: EPISODE_COMMENTS_STALE_TIME,
  })
