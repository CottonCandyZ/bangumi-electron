import {
  HOST,
  NEXT_COMMUNITY,
  NEXT_USERS,
  nextFetchWithOptionalAuth,
} from '@renderer/data/fetch/config'
import {
  CommunityTopic,
  Group,
  GroupMember,
  GroupSort,
  GroupTopic,
  GroupTopicListItem,
  SlimGroup,
  SubjectTopic,
  SubjectTopicSource,
  TopicResponse,
} from '@renderer/data/types/community'
import type { SubjectId } from '@renderer/data/types/bgm'
import type { UserInfo } from '@renderer/data/types/user'

type GroupResponse = {
  data: SlimGroup[]
  total: number
}

export async function getGroups({
  sort = 'members',
  limit,
  offset,
}: {
  sort?: GroupSort
  limit: number
  offset: number
}) {
  return nextFetchWithOptionalAuth<GroupResponse>(NEXT_COMMUNITY.GROUPS({ sort, limit, offset }))
}

export async function getUserGroups({
  username,
  limit,
  offset,
}: {
  username: UserInfo['username'] | undefined
  limit: number
  offset: number
}) {
  if (!username) return { data: [], total: 0 }
  return nextFetchWithOptionalAuth<GroupResponse>(
    NEXT_USERS.GROUPS_BY_USERNAME(username, limit, offset),
  )
}

export async function getGroupByName({ groupName }: { groupName: string | undefined }) {
  if (!groupName) return null
  return nextFetchWithOptionalAuth<Group>(NEXT_COMMUNITY.GROUP_BY_NAME(groupName))
}

export async function getGroupMembers({
  groupName,
  limit,
  offset,
}: {
  groupName: string | undefined
  limit: number
  offset: number
}) {
  if (!groupName) return { data: [], total: 0 }
  return nextFetchWithOptionalAuth<TopicResponse<GroupMember>>(
    NEXT_COMMUNITY.GROUP_MEMBERS({ groupName, limit, offset }),
  )
}

export async function getGroupTopics({
  group,
  groupName,
  limit,
  offset,
}: {
  group?: SlimGroup | null
  groupName: string | undefined
  limit: number
  offset: number
}) {
  if (!groupName) return { data: [], total: 0 }
  const response = await nextFetchWithOptionalAuth<TopicResponse<GroupTopicListItem>>(
    NEXT_COMMUNITY.GROUP_TOPICS({ groupName, limit, offset }),
  )

  return {
    ...response,
    data: response.data.map((topic) => toCommunityGroupTopicFromList(topic, group)),
  }
}

export async function getRecentGroupTopics({
  mode = 'all',
  limit,
  offset,
}: {
  mode?: 'all' | 'joined' | 'created' | 'replied'
  limit: number
  offset: number
}) {
  const response = await nextFetchWithOptionalAuth<TopicResponse<GroupTopic>>(
    NEXT_COMMUNITY.RECENT_GROUP_TOPICS({ mode, limit, offset }),
  )

  return {
    ...response,
    data: response.data.map(toCommunityGroupTopic),
  }
}

export async function getRecentSubjectTopics({ limit, offset }: { limit: number; offset: number }) {
  const response = await nextFetchWithOptionalAuth<TopicResponse<SubjectTopic>>(
    NEXT_COMMUNITY.RECENT_SUBJECT_TOPICS({ limit, offset }),
  )

  return {
    ...response,
    data: response.data.map(toCommunitySubjectTopic('subject')),
  }
}

export async function getSubjectTopics({
  subject,
  subjectId,
  limit,
  offset,
}: {
  subject?: SubjectTopicSource | null
  subjectId: SubjectId | undefined
  limit: number
  offset: number
}) {
  if (!subjectId) return { data: [], total: 0 }
  const response = await nextFetchWithOptionalAuth<TopicResponse<GroupTopicListItem>>(
    NEXT_COMMUNITY.SUBJECT_TOPICS({ subjectId, limit, offset }),
  )

  return {
    ...response,
    data: response.data.map((topic) => toCommunitySubjectTopicFromList(topic, subjectId, subject)),
  }
}

export async function getTrendingSubjectTopics({
  limit,
  offset,
}: {
  limit: number
  offset: number
}) {
  const response = await nextFetchWithOptionalAuth<TopicResponse<SubjectTopic>>(
    NEXT_COMMUNITY.TRENDING_SUBJECT_TOPICS({ limit, offset }),
  )

  return {
    ...response,
    data: response.data.map(toCommunitySubjectTopic('trending-subject')),
  }
}

export async function getGroupTopic({ topicId }: { topicId: number }) {
  return nextFetchWithOptionalAuth<GroupTopic>(`/p1/groups/-/topics/${topicId}`)
}

export async function getSubjectTopic({ topicId }: { topicId: number }) {
  return nextFetchWithOptionalAuth<SubjectTopic>(`/p1/subjects/-/topics/${topicId}`)
}

function toCommunityGroupTopic(topic: GroupTopic): CommunityTopic {
  return {
    id: topic.id,
    kind: 'group',
    title: topic.title,
    creator: topic.creator,
    replyCount: topic.replyCount,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    route: `/group/topic/${topic.id}`,
    source: {
      title: topic.group.title || topic.group.name,
      route: `/group/${topic.group.name}`,
      image: normalizeImageUrl(topic.group.icon?.medium ?? topic.group.icon?.small),
      meta: `${topic.group.members} 成员`,
    },
  }
}

function toCommunityGroupTopicFromList(
  topic: GroupTopicListItem,
  group: SlimGroup | null | undefined,
): CommunityTopic {
  const sourceTitle = group?.title || group?.name || ''

  return {
    id: topic.id,
    kind: 'group',
    title: topic.title,
    creator: topic.creator,
    replyCount: topic.replyCount,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    route: `/group/topic/${topic.id}`,
    source: {
      title: sourceTitle,
      route: group?.name ? `/group/${group.name}` : '',
      image: normalizeImageUrl(group?.icon?.medium ?? group?.icon?.small),
      meta: group?.members !== undefined ? `${group.members} 成员` : undefined,
    },
  }
}

function toCommunitySubjectTopicFromList(
  topic: GroupTopicListItem,
  subjectId: SubjectId,
  subject: SubjectTopicSource | null | undefined,
): CommunityTopic {
  const subjectTitle = subject?.nameCN || subject?.name_cn || subject?.name || `条目 ${subjectId}`

  return {
    id: topic.id,
    kind: 'subject',
    title: topic.title,
    creator: topic.creator,
    replyCount: topic.replyCount,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    route: `/subject/topic/${topic.id}`,
    source: {
      title: subjectTitle,
      route: `/subject/${subjectId}`,
      image: normalizeImageUrl(subject?.images?.grid ?? subject?.images?.small),
      meta: subject?.name_cn || subject?.nameCN ? subject.name : undefined,
    },
  }
}

function toCommunitySubjectTopic(kind: 'subject' | 'trending-subject') {
  return (topic: SubjectTopic): CommunityTopic => {
    const subjectTitle = topic.subject.nameCN || topic.subject.name

    return {
      id: topic.id,
      kind,
      title: topic.title,
      creator: topic.creator,
      replyCount: topic.replyCount,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      route: `/subject/topic/${topic.id}`,
      source: {
        title: subjectTitle,
        route: `/subject/${topic.subject.id}`,
        image: normalizeImageUrl(topic.subject.images?.grid ?? topic.subject.images?.small),
        meta: topic.subject.nameCN ? topic.subject.name : undefined,
      },
    }
  }
}

function normalizeImageUrl(url: string | undefined) {
  if (!url) return undefined
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${HOST}${url}`
  return url
}
