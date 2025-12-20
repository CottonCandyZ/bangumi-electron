import { getEpisodesBySubjectId } from '@renderer/data/fetch/api/episodes'
import { useAuthQuery } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'

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
  })
