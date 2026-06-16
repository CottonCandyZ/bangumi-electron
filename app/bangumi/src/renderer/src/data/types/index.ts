import type { Episode } from '@renderer/data/types/episode'
import type { CommentUser } from '@renderer/data/types/comment'
import type { GroupTopic, SubjectTopic } from '@renderer/data/types/community'
import type { P1SlimSubject } from '@renderer/data/types/subject'

export type IndexResourceType = 'subject' | 'character' | 'person'

export type IndexStats = {
  blog?: number
  character?: number
  episode?: number
  groupTopic?: number
  person?: number
  subject: {
    anime?: number
    book?: number
    game?: number
    music?: number
    real?: number
  }
  subjectTopic?: number
}

export type SlimIndex = {
  createdAt: number
  id: number
  private: boolean
  stats: IndexStats
  title: string
  total: number
  type: number
  uid: number
  updatedAt: number
  user?: CommentUser
}

export type Index = SlimIndex & {
  award: number
  collectedAt?: number
  collects: number
  desc: string
  replies: number
}

export type P1SlimMono = {
  career?: string[]
  comment: number
  id: number
  images?: {
    grid?: string
    large?: string
    medium?: string
    small?: string
  }
  info: string
  lock: boolean
  name: string
  nameCN: string
  nsfw: boolean
  role?: number
  type?: number
}

export type SlimBlogEntry = {
  createdAt: number
  icon: string
  id: number
  public: boolean
  replies: number
  summary: string
  title: string
  type: number
  uid: number
  updatedAt: number
  user?: CommentUser
}

export type IndexRelatedCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type IndexRelated = {
  award: string
  blog?: SlimBlogEntry
  cat: IndexRelatedCategory
  character?: P1SlimMono
  comment: string
  createdAt: number
  episode?: Episode & {
    nameCN?: string
    subject?: P1SlimSubject
    subjectID?: number
  }
  groupTopic?: GroupTopic
  id: number
  order: number
  person?: P1SlimMono
  rid: number
  sid: number
  subject?: P1SlimSubject
  subjectTopic?: SubjectTopic
  type: number
}
