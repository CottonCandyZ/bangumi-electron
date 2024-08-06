import { searchV0 } from '@renderer/data/fetch/api/serach'
import { SearchParm } from '@renderer/data/types/search'
import { useInfiniteQuery } from '@tanstack/react-query'

export const useInfinityQuerySearch = ({
  searchParm,
  limit = 3,
  initialPageParam = 0,
}: {
  limit?: number
  initialPageParam?: number
  searchParm: SearchParm
}) =>
  useInfiniteQuery({
    queryKey: ['search', limit, searchParm],
    queryFn: async ({ pageParam }) => searchV0({ offset: pageParam, limit: limit, searchParm }),
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit
      if (next >= lastPage.total) return null
      else return next
    },
    initialPageParam,
  })
