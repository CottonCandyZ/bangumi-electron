import {
  getEpisodesCollectionBySubjectId,
  getSubjectCollectionBySubjectIdAndUsername,
  getSubjectCollectionsByUsername,
} from '@renderer/data/fetch/api/collection'
import {
  useInfinityQueryOptionalAuth,
  useQueryMustAuth,
  useQueryOptionalAuth,
} from '@renderer/data/hooks/factory'
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
}: OmitInfinityQFP<Parameters<typeof getSubjectCollectionsByUsername>[0]> & {
  username: UserInfo['username'] | undefined
  initialPageParm?: number
  enabled?: boolean
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getSubjectCollectionsByUsername,
    queryKey: ['collection-subjects'],
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
    queryFn: getEpisodesCollectionBySubjectId,
    queryKey: ['collection-episodes'],
    queryProps: { subjectId, limit, offset, episodeType },
    enabled,
    staleTime: 1000 * 60 * 10,
  })

export const useQuerySubjectCollection = ({
  subjectId,
  username,
  enabled,
  needKeepPreviousData,
}: {
  subjectId: SubjectId | undefined
  username: UserInfo['username'] | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getSubjectCollectionBySubjectIdAndUsername,
    queryKey: ['collection-subject'],
    queryProps: { subjectId, username },
    enabled: enabled,
    needKeepPreviousData,
  })
