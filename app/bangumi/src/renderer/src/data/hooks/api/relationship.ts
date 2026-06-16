import {
  addBlock,
  addFriend,
  getBlocklist,
  getFriendlist,
  getMyFollowers,
  getMyFriends,
  getUserFollowers,
  getUserFriends,
  removeBlock,
  removeFriend,
} from '@renderer/data/fetch/api/relationship'
import {
  useAuthQuery,
  useInfinityQueryOptionalAuth,
  useMutationMustAuth,
} from '@renderer/data/hooks/factory'
import type { UserInfo } from '@renderer/data/types/user'
import { useQueryClient } from '@tanstack/react-query'

export const useFriendlistQuery = ({ enabled }: { enabled?: boolean } = {}) =>
  useAuthQuery({
    queryFn: getFriendlist,
    queryKey: ['friendlist'],
    enabled,
    staleTime: 1000 * 60,
  })

export const useBlocklistQuery = ({ enabled }: { enabled?: boolean } = {}) =>
  useAuthQuery({
    queryFn: getBlocklist,
    queryKey: ['blocklist'],
    enabled,
    staleTime: 1000 * 60,
  })

export const useMyFriendsQuery = ({ enabled, limit = 20 }: { enabled?: boolean; limit?: number }) =>
  useInfinityQueryOptionalAuth({
    queryFn: getMyFriends,
    queryKey: ['my-friends'],
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useMyFollowersQuery = ({
  enabled,
  limit = 20,
}: {
  enabled?: boolean
  limit?: number
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getMyFollowers,
    queryKey: ['my-followers'],
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useUserFriendsQuery = ({
  enabled,
  limit = 20,
  username,
}: {
  enabled?: boolean
  limit?: number
  username: UserInfo['username'] | undefined
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getUserFriends,
    queryKey: ['user-friends'],
    queryProps: { username },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useUserFollowersQuery = ({
  enabled,
  limit = 20,
  username,
}: {
  enabled?: boolean
  limit?: number
  username: UserInfo['username'] | undefined
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getUserFollowers,
    queryKey: ['user-followers'],
    queryProps: { username },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useAddFriendMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: addFriend,
    mutationKey: ['add-friend'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendlist'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export const useRemoveFriendMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: removeFriend,
    mutationKey: ['remove-friend'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendlist'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export const useAddBlockMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: addBlock,
    mutationKey: ['add-block'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocklist'] })
      queryClient.invalidateQueries({ queryKey: ['friendlist'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export const useRemoveBlockMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: removeBlock,
    mutationKey: ['remove-block'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocklist'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}
