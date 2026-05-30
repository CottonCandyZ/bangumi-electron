import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'

/**
 * v0/me
 */
export type UserInfo = {
  avatar: { large: string; medium: string; small: string }
  sign: string
  username: string
  nickname: string
  id: number
  user_group: UserGroup
  url: string
  time_offset: number
}

export type UerInfoAPI = UserInfo

export type UserNetworkService = {
  name: string
  title: string
  url: string
  color: string
  account: string
}

export type UserHomepageSection =
  | 'anime'
  | 'game'
  | 'book'
  | 'music'
  | 'real'
  | 'mono'
  | 'blog'
  | 'friend'
  | 'group'
  | 'index'

export type UserProfile = {
  id: number
  username: string
  nickname: string
  avatar: UserInfo['avatar']
  group: number
  joinedAt: number
  sign: string
  site: string
  location: string
  bio: string
  networkServices: UserNetworkService[]
  homepage: {
    left: UserHomepageSection[]
    right: UserHomepageSection[]
  }
  stats: {
    subject: Partial<Record<SubjectType, Partial<Record<CollectionType, number>>>>
    mono: {
      character: number
      person: number
    }
    blog: number
    friend: number
    group: number
    index: {
      create: number
      collect: number
    }
  }
}

export type UserTimelineSlimSubject = {
  id: number
  name: string
  nameCN: string
  type: SubjectType
  images?: {
    small: string
    grid: string
    large: string
    medium: string
    common: string
  }
  info: string
  rating: {
    rank: number
    total: number
    score: number
    count: number[]
  }
  locked: boolean
  nsfw: boolean
}

export type UserTimelineSlimUser = {
  id: number
  username: string
  nickname: string
  avatar: UserInfo['avatar']
  group: number
  sign: string
  joinedAt: number
}

export type UserTimelineSlimGroup = {
  id: number
  name: string
  nsfw: boolean
  title: string
  icon: UserInfo['avatar']
  creatorID: number
  members: number
  accessible: boolean
  createdAt: number
}

export type UserTimelineSlimBlogEntry = {
  id: number
  type: number
  uid: number
  user?: UserTimelineSlimUser
  title: string
  icon: string
  summary: string
  replies: number
  public: boolean
  createdAt: number
  updatedAt: number
}

export type UserTimelineSlimIndex = {
  id: number
  uid: number
  user?: UserTimelineSlimUser
  type: number
  title: string
  private: boolean
  total: number
  stats: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export type UserTimelineSlimMono = {
  id: number
  name: string
  nameCN: string
  type?: number
  role?: number
  info: string
  images?: {
    large?: string
    medium?: string
    small?: string
    grid?: string
  }
  comment: number
  lock: boolean
  nsfw: boolean
}

export type UserTimelineEpisode = {
  id: number
  subjectID: number
  sort: number
  type: number
  disc: number
  name: string
  nameCN: string
  duration: string
  airdate: string
  comment: number
  desc: string
  subject?: UserTimelineSlimSubject
}

export type UserTimelineItem = {
  id: number
  uid: number
  user?: UserTimelineSlimUser
  cat: number
  type: number
  batch: boolean
  replies: number
  createdAt: number
  source: {
    name: string
    url?: string
  }
  memo: {
    daily?: {
      users?: UserTimelineSlimUser[]
      groups?: UserTimelineSlimGroup[]
    }
    wiki?: {
      subject?: UserTimelineSlimSubject
    }
    subject?: {
      subject: UserTimelineSlimSubject
      comment: string
      rate?: number
      collectID?: number
    }[]
    status?: {
      sign?: string
      tsukkomi?: string
      nickname?: {
        before: string
        after: string
      }
    }
    progress?: {
      batch?: {
        epsTotal: string
        epsUpdate?: number
        volsTotal: string
        volsUpdate?: number
        subject: UserTimelineSlimSubject
      }
      single?: {
        episode: UserTimelineEpisode
        subject: UserTimelineSlimSubject
      }
    }
    blog?: UserTimelineSlimBlogEntry
    index?: UserTimelineSlimIndex
    mono?: {
      characters: UserTimelineSlimMono[]
      persons: UserTimelineSlimMono[]
    }
  }
}

export enum UserGroup {
  '管理员' = 1,
  'Bangumi 管理猿',
  '天窗管理员',
  '禁言用户',
  '禁止访问用户',
  '人物管理猿' = 8,
  '维基条目管理猿',
  '用户',
  '维基人',
}
