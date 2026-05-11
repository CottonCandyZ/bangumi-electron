import {
  getUserInfoByUsername,
  getUserProfileByUsername,
  getUserTimelineByUsername,
} from '@renderer/data/fetch/api/user'
import { useAuthQuery } from '@renderer/data/hooks/factory'
import { UserInfo } from '@renderer/data/types/user'
import { userIdAtom } from '@renderer/state/session'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

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
}: {
  username: UserInfo['username'] | undefined
  limit?: number
  enabled?: boolean
}) => {
  const userId = useAtomValue(userIdAtom)

  return useInfiniteQuery({
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
  })
}
