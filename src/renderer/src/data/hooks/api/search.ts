import { searchV0 } from '@renderer/data/fetch/api/serach'
import { useInfinityQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { SearchParm } from '@renderer/data/types/search'

export const useInfinityQuerySearch = ({
  searchParm,
  limit = 9,
  initialPageParam = 0,
}: {
  limit?: number
  initialPageParam?: number
  searchParm: SearchParm
}) =>
  useInfinityQueryOptionalAuth({
    queryKey: ['search'],
    queryFn: searchV0,
    qFLimit: limit,
    queryProps: { searchParm },
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit
      if (next >= lastPage.total) return null
      else return next
    },
    initialPageParam,
  })
