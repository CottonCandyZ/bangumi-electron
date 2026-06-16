import { getTimeline } from '@renderer/data/fetch/api/timeline'
import {
  DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  trimInfiniteQueryPagesIf,
  trimInfiniteQueryPages,
} from '@renderer/data/hooks/infinite-query'
import type { TimelineMode } from '@renderer/data/types/timeline'
import type { UserTimelineItem } from '@renderer/data/types/user'
import { userIdAtom } from '@renderer/state/session'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

export const SITE_TIMELINE_STALE_TIME = 2 * 60 * 1000

const getSiteTimelineInfiniteQueryKey = ({
  limit,
  mode,
  userId,
}: {
  limit: number
  mode?: TimelineMode
  userId: unknown
}) => ['site-timeline-infinite-v1', userId, mode, limit] as const

export const useTimelineQuery = ({
  enabled = true,
  limit = 10,
  mode,
  staleTime = SITE_TIMELINE_STALE_TIME,
}: {
  enabled?: boolean
  limit?: number
  mode?: TimelineMode
  staleTime?: number
} = {}) => {
  const userId = useAtomValue(userIdAtom)

  return useQuery({
    queryKey: ['site-timeline-v1', userId, mode, limit],
    queryFn: () => getTimeline({ limit, mode }),
    enabled,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime,
  })
}

export const useTimelineInfiniteQuery = ({
  enabled = true,
  limit = 20,
  mode,
  refetchPageLimit = DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  staleTime = SITE_TIMELINE_STALE_TIME,
}: {
  enabled?: boolean
  limit?: number
  mode?: TimelineMode
  refetchPageLimit?: number
  staleTime?: number
} = {}) => {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => getSiteTimelineInfiniteQueryKey({ userId, mode, limit }),
    [limit, mode, userId],
  )

  const query = useInfiniteQuery({
    queryKey: ['site-timeline-infinite-v1', userId, mode, limit],
    queryFn: ({ pageParam }) => getTimeline({ limit, mode, until: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined
      const nextPageParam = lastPage.at(-1)?.id
      if (nextPageParam === undefined) return undefined

      const previousPageParams = new Set(
        allPages.slice(0, -1).flatMap((page) => {
          const previousPageParam = page.at(-1)?.id
          return previousPageParam === undefined ? [] : [previousPageParam]
        }),
      )

      if (previousPageParams.has(nextPageParam)) return undefined
      return nextPageParam
    },
    enabled,
    refetchOnMount: (query) => {
      trimInfiniteQueryPagesIf<UserTimelineItem[], number | undefined>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    refetchOnReconnect: (query) => {
      trimInfiniteQueryPagesIf<UserTimelineItem[], number | undefined>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    refetchOnWindowFocus: (query) => {
      trimInfiniteQueryPagesIf<UserTimelineItem[], number | undefined>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    staleTime,
  })
  const { refetch: originalRefetch } = query

  const refetch = useCallback(
    (...args: Parameters<typeof originalRefetch>) => {
      trimInfiniteQueryPages<UserTimelineItem[], number | undefined>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey,
      })

      return originalRefetch(...args)
    },
    [originalRefetch, queryClient, queryKey, refetchPageLimit],
  )

  const refreshFirstPage = useCallback(() => {
    trimInfiniteQueryPages<UserTimelineItem[], number | undefined>({
      pageLimit: 1,
      queryClient,
      queryKey,
    })

    return originalRefetch()
  }, [originalRefetch, queryClient, queryKey])

  return {
    ...query,
    refetch,
    refreshFirstPage,
  }
}
