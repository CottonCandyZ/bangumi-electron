import { searchV0 } from '@renderer/data/fetch/api/serach'
import { useInfinityQueryOptionalAuth, useQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { SearchParam } from '@renderer/data/types/search'

export const useInfinityQuerySearch = ({
  searchParam,
  limit = 9,
  initialPageParam = 0,
}: {
  limit?: number
  initialPageParam?: number
  searchParam: SearchParam
}) =>
  useInfinityQueryOptionalAuth({
    queryKey: ['search'],
    queryFn: searchV0,
    qFLimit: limit,
    queryProps: { searchParam },
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit
      if (next >= lastPage.total) return null
      else return next
    },
    initialPageParam,
  })

export const useQuerySearch = ({
  searchParam,
  limit = 20,
  offset = 0,
}: {
  limit?: number
  offset?: number
  searchParam: SearchParam
}) =>
  useQueryOptionalAuth({
    queryKey: ['search'],
    queryFn: searchV0,
    queryProps: { offset, limit, searchParam },
    needKeepPreviousData: false,
  })
