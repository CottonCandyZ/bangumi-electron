import { getEpisodesBySubjectId } from '@renderer/constants/fetch/api/episodes'
import { useQueryOptionalAuth } from '@renderer/constants/hooks/factory'
import { SubjectId } from '@renderer/constants/types/bgm'

/**
 * 使用 SubjectId 获得 Episodes
 *
 * TODO: 实现分页版本
 */
export const useQueryEpisodesInfoBySubjectId = ({
  id,
  limit = 100,
  offset = 0,
  type,
  enabled,
}: {
  id: SubjectId | undefined
  limit?: number
  offset?: number
  type?: number
  enabled?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getEpisodesBySubjectId,
    queryKey: ['episodes-info'],
    props: { id, limit, offset, type },
    enabled: enabled,
  })
