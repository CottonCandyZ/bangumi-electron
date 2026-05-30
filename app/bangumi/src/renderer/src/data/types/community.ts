import { CommentReaction, CommentUser } from '@renderer/data/types/comment'

export type TopicResponse<T> = {
  data: T[]
  total: number
}

export type TopicBase = {
  id: number
  title: string
  creatorID: number
  parentID: number
  replyCount: number
  createdAt: number
  updatedAt: number
  state: number
  display: number
  creator?: CommentUser
}

export type TopicReplyBase = {
  id: number
  creatorID: number
  createdAt: number
  content: string
  state: number
  creator?: CommentUser
  reactions?: CommentReaction[]
}

export type TopicReply = TopicReplyBase & {
  replies: TopicReplyBase[]
}

export type SlimGroup = {
  id: number
  name: string
  nsfw?: boolean
  title: string
  icon?: {
    small?: string
    medium?: string
    large?: string
  }
  creatorID?: number
  topics?: number
  posts?: number
  members: number
  accessible?: boolean
  createdAt?: number
}

export type GroupSort = 'posts' | 'topics' | 'members' | 'created' | 'updated'

export type Group = SlimGroup & {
  cat: number
  creator?: CommentUser
  description: string
  topics: number
  posts: number
  creatorID: number
  accessible: boolean
  createdAt: number
}

export type GroupMember = {
  uid: number
  role: number
  joinedAt: number
  user?: CommentUser
}

export type SlimSubject = {
  id: number
  name: string
  nameCN: string
  type: number
  images?: {
    large?: string
    common?: string
    medium?: string
    small?: string
    grid?: string
  }
}

export type GroupTopic = TopicBase & {
  group: SlimGroup
  replies: TopicReply[]
}

export type GroupTopicListItem = TopicBase

export type SubjectTopic = TopicBase & {
  subject: SlimSubject
  replies: TopicReply[]
}

export type CommunityTopicKind = 'group' | 'subject' | 'trending-subject'

export type CommunityTopic = {
  id: number
  kind: CommunityTopicKind
  title: string
  creator?: CommentUser
  replyCount: number
  createdAt: number
  updatedAt: number
  route: string
  source: {
    title: string
    route: string
    image?: string
    meta?: string
  }
}
