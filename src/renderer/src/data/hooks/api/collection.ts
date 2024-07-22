import { getCollectionsByUsername } from '@renderer/data/fetch/api/collection'
import { useInfinityQueryOptionalAuth } from '@renderer/data/hooks/factory'
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
