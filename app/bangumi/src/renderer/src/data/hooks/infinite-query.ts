import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query'

export const DEFAULT_INFINITE_REFETCH_PAGE_LIMIT = 5

export function trimInfiniteQueryPagesIf<TPage, TPageParam>({
  pageLimit = DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  queryClient,
  queryKey,
  shouldTrim,
}: {
  pageLimit?: number
  queryClient: QueryClient
  queryKey: QueryKey
  shouldTrim: boolean
}) {
  if (!shouldTrim) return

  trimInfiniteQueryPages<TPage, TPageParam>({
    pageLimit,
    queryClient,
    queryKey,
  })
}

export function trimInfiniteQueryPages<TPage, TPageParam>({
  pageLimit = DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  queryClient,
  queryKey,
}: {
  pageLimit?: number
  queryClient: QueryClient
  queryKey: QueryKey
}) {
  if (pageLimit <= 0) return

  queryClient.setQueryData<InfiniteData<TPage, TPageParam>>(queryKey, (data) => {
    if (!data || data.pages.length <= pageLimit) return data

    return {
      pages: data.pages.slice(0, pageLimit),
      pageParams: data.pageParams.slice(0, pageLimit),
    }
  })
}
