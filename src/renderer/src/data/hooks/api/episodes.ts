import { getEpisodesBySubjectId } from '@renderer/data/fetch/api/episodes'
import { useQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'

/**
 * 使用 SubjectId 获得 Episodes
 *
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
