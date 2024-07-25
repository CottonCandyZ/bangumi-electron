import {
  getCollectionEpisodesBySubjectId,
  getCollectionsByUsername,
} from '@renderer/data/fetch/api/collection'
import { useInfinityQueryOptionalAuth, useQueryMustAuth } from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'
import { UserInfo } from '@renderer/data/types/user'

type OmitInfinityQFP<P> = Omit<P, 'token' | 'offset'>

export const useInfinityQueryCollectionsByUsername = ({
  username,
  subjectType,
  collectionType,
  limit = 3,
  initialPageParm = 0,
  enabled,
}: OmitInfinityQFP<Parameters<typeof getCollectionsByUsername>[0]> & {
  username: UserInfo['username'] | undefined
  initialPageParm?: number
  enabled?: boolean
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getCollectionsByUsername,
    queryKey: ['episodes-info'],
    props: { username, collectionType, subjectType },
    qFLimit: limit,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit
      if (next >= lastPage.total) return null
      else return next
    },
    initialPageParam: initialPageParm,
    enabled,
  })

export const useQueryCollectionEpisodesInfoBySubjectId = ({
  subjectId,
  limit = 100,
  offset = 0,
  episodeType,
  enabled,
}: {
  subjectId: SubjectId | undefined
  limit?: number
  offset?: number
  episodeType?: number
  enabled?: boolean
}) =>
  useQueryMustAuth({
    queryFn: getCollectionEpisodesBySubjectId,
    queryKey: ['episodes-info'],
    queryProps: { subjectId, limit, offset, episodeType },
    enabled,
    staleTime: 1000 * 60 * 10,
  })
