import type { Comment } from '@renderer/data/types/comment'
import type { P1Page, P1SlimSubject } from '@renderer/data/types/subject'
import type { UserTimelineSlimUser } from '@renderer/data/types/user'

export type SlimBlogEntry = {
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

export type BlogEntry = Omit<SlimBlogEntry, 'summary' | 'user'> & {
  user: UserTimelineSlimUser
  content: string
  tags: string[]
  views: number
  noreply: number
  related: number
}

export type BlogPhoto = {
  id: number
  target: string
  icon: string
  vote: number
  createdAt: number
}

export type SubjectReview = {
  id: number
  user: UserTimelineSlimUser
  entry: SlimBlogEntry
}

export type BlogListPage = P1Page<SlimBlogEntry>
export type BlogPhotoPage = P1Page<BlogPhoto>
export type SubjectReviewPage = P1Page<SubjectReview>
export type BlogComments = Comment[]
export type BlogSubjects = P1SlimSubject[]
