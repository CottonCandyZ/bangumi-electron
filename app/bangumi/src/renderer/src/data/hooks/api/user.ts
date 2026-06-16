import {
  getUserInfoByUsername,
  getUserProfileByUsername,
  getUserTimelineByUsername,
} from '@renderer/data/fetch/api/user'
import { useAuthQuery } from '@renderer/data/hooks/factory'
import {
  DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  trimInfiniteQueryPagesIf,
  trimInfiniteQueryPages,
} from '@renderer/data/hooks/infinite-query'
import { UserInfo, UserTimelineItem } from '@renderer/data/types/user'
import { userIdAtom } from '@renderer/state/session'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

const getUserTimelineInfiniteQueryKey = ({
  limit,
  userId,
  username,
}: {
  limit: number
  userId: unknown
  username: UserInfo['username'] | undefined
}) => ['user-timeline-infinite', userId, username, limit] as const

export const useUserInfoByUsernameQuery = ({
  username,
  enabled,
}: {
  username: UserInfo['username'] | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getUserInfoByUsername,
    queryKey: ['user-info'],
    queryProps: { username },
    enabled,
  })

export const useUserProfileQuery = ({
  username,
  enabled,
}: {
  username: UserInfo['username'] | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getUserProfileByUsername,
    queryKey: ['user-profile'],
    queryProps: { username },
    enabled,
  })

export const useUserTimelineQuery = ({
  username,
  limit = 10,
  enabled,
}: {
  username: UserInfo['username'] | undefined
  limit?: number
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getUserTimelineByUsername,
    queryKey: ['user-timeline'],
    queryProps: { username, limit },
    enabled,
  })

export const useUserTimelineInfiniteQuery = ({
  username,
  limit = 20,
  enabled,
  refetchPageLimit = DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
}: {
  username: UserInfo['username'] | undefined
  limit?: number
  enabled?: boolean
  refetchPageLimit?: number
}) => {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => getUserTimelineInfiniteQueryKey({ userId, username, limit }),
    [limit, userId, username],
  )

  const query = useInfiniteQuery({
    queryKey: ['user-timeline-infinite', userId, username, limit],
    queryFn: ({ pageParam }) =>
      getUserTimelineByUsername({
        username,
        limit,
        until: pageParam,
      }),
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
