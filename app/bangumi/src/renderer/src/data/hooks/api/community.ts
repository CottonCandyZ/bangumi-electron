import {
  createGroupTopic,
  getGroupByName,
  getGroupMembers,
  getGroups,
  getGroupTopic,
  getGroupTopics,
  getRecentGroupTopics,
  getRecentSubjectTopics,
  getSubjectTopic,
  getSubjectTopics,
  getTrendingSubjectTopics,
  getUserGroups,
} from '@renderer/data/fetch/api/community'
import {
  useAuthQuery,
  useInfinityQueryOptionalAuth,
  useMutationMustAuth,
} from '@renderer/data/hooks/factory'
import type { SubjectId } from '@renderer/data/types/bgm'
import type { GroupSort } from '@renderer/data/types/community'
import type { SlimGroup, SubjectTopicSource } from '@renderer/data/types/community'
import type { UserInfo } from '@renderer/data/types/user'
import { useQueryClient } from '@tanstack/react-query'

const COMMUNITY_TOPIC_DETAIL_STALE_TIME = 1000 * 30

export const useGroupsQuery = ({
  enabled,
  limit = 12,
  sort = 'members',
}: {
  enabled?: boolean
  limit?: number
  sort?: GroupSort
} = {}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getGroups,
    queryKey: ['community-groups-v1'],
    queryProps: { sort },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useGroupByNameQuery = ({
  groupName,
  enabled,
}: {
  groupName: string | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getGroupByName,
    queryKey: ['community-group-v1'],
    queryProps: { groupName },
    enabled,
  })

export const useGroupMembersQuery = ({
  groupName,
  enabled,
  limit = 24,
}: {
  groupName: string | undefined
  enabled?: boolean
  limit?: number
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getGroupMembers,
    queryKey: ['community-group-members-v1'],
    queryProps: { groupName },
    qFLimit: limit,
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useGroupTopicsQuery = ({
  enabled,
  group,
  groupName,
  limit = 24,
}: {
  enabled?: boolean
  group?: SlimGroup | null
  groupName: string | undefined
  limit?: number
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getGroupTopics,
    queryKey: ['community-single-group-topics-v1'],
    queryProps: { groupName, group },
    qFLimit: limit,
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useUserGroupsQuery = ({
  enabled,
  limit = 12,
  username,
}: {
  enabled?: boolean
  limit?: number
  username: UserInfo['username'] | undefined
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getUserGroups,
    queryKey: ['community-user-groups-v1'],
    queryProps: { username },
    qFLimit: limit,
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useRecentGroupTopicsQuery = ({
  enabled,
  mode = 'all',
  limit = 20,
}: {
  enabled?: boolean
  mode?: 'all' | 'joined' | 'created' | 'replied'
  limit?: number
} = {}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getRecentGroupTopics,
    queryKey: ['community-group-topics-v3'],
    queryProps: { mode },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useRecentSubjectTopicsQuery = ({ limit = 20 }: { limit?: number } = {}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getRecentSubjectTopics,
    queryKey: ['community-subject-topics-v3'],
    qFLimit: limit,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useSubjectTopicsQuery = ({
  enabled,
  limit = 20,
  subject,
  subjectId,
}: {
  enabled?: boolean
  limit?: number
  subject?: SubjectTopicSource | null
  subjectId: SubjectId | undefined
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getSubjectTopics,
    queryKey: ['community-single-subject-topics-v1'],
    queryProps: { subjectId, subject },
    qFLimit: limit,
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useTrendingSubjectTopicsQuery = ({ limit = 20 }: { limit?: number } = {}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getTrendingSubjectTopics,
    queryKey: ['community-trending-subject-topics-v3'],
    qFLimit: limit,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useGroupTopicQuery = ({ topicId }: { topicId: number }) =>
  useAuthQuery({
    queryFn: getGroupTopic,
    queryKey: ['community-group-topic'],
    queryProps: { topicId },
    staleTime: COMMUNITY_TOPIC_DETAIL_STALE_TIME,
  })

export const useSubjectTopicQuery = ({ topicId }: { topicId: number }) =>
  useAuthQuery({
    queryFn: getSubjectTopic,
    queryKey: ['community-subject-topic'],
    queryProps: { topicId },
    staleTime: COMMUNITY_TOPIC_DETAIL_STALE_TIME,
  })

export const useCreateGroupTopicMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: createGroupTopic,
    mutationKey: ['create-group-topic'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-single-group-topics-v1'] })
      queryClient.invalidateQueries({ queryKey: ['community-group-topics-v3'] })
    },
  })
}
