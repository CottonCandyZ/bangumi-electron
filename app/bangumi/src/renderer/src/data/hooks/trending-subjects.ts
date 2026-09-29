import { getTrendingSubjects, type TrendingSubjectsPage } from '@renderer/data/fetch/api/trending'
import { trimInfiniteQueryPages, trimInfiniteQueryPagesIf } from './infinite-query'
import type { SectionPath } from '@renderer/data/types/web'
import { userIdAtom } from '@renderer/state/session'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

const TRENDING_STALE_TIME = 60 * 60 * 1000

export function useTopListQuery(sectionPath: SectionPath) {
  const userId = useAtomValue(userIdAtom)
  const apiQuery = useQuery({
    queryKey: ['SectionTrendsApiV1', sectionPath, userId],
    queryFn: ({ signal }) => getTrendingSubjects({ sectionPath, signal }),
    staleTime: TRENDING_STALE_TIME,
    select: (page) => page.data,
  })

  return { ...apiQuery, isRefreshing: apiQuery.isFetching }
}

export function useTrendsInfiniteQuery(sectionPath: SectionPath) {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => ['SectionTrendsApiInfiniteV1', sectionPath, userId] as const,
    [sectionPath, userId],
  )
  const apiQuery = useInfiniteQuery({
    queryKey: ['SectionTrendsApiInfiniteV1', sectionPath, userId],
    queryFn: ({ pageParam, signal }) =>
      getTrendingSubjects({ sectionPath, offset: pageParam, signal }),
    staleTime: TRENDING_STALE_TIME,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    select: (data) => ({ ...data, pages: data.pages.map((page) => page.data) }),
    refetchOnMount: (query) => {
      trimInfiniteQueryPagesIf<TrendingSubjectsPage, number>({
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    refetchOnReconnect: (query) => {
      trimInfiniteQueryPagesIf<TrendingSubjectsPage, number>({
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    refetchOnWindowFocus: (query) => {
      trimInfiniteQueryPagesIf<TrendingSubjectsPage, number>({
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
  })
  const { refetch } = apiQuery
  const refresh = useCallback(() => {
    trimInfiniteQueryPages<TrendingSubjectsPage, number>({ queryClient, queryKey })
    return refetch()
  }, [queryClient, queryKey, refetch])

  return { ...apiQuery, refetch: refresh, isRefreshing: apiQuery.isFetching }
}
