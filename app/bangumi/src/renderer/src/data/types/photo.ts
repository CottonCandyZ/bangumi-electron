import type { Comment } from '@renderer/data/types/comment'
import type { P1Page } from '@renderer/data/types/subject'
import type { UserTimelineSlimUser } from '@renderer/data/types/user'

export type MonoPhoto = {
  id: number
  type: number
  mainID: number
  creatorID: number
  user?: UserTimelineSlimUser
  target: string
  images: {
    large: string
    common: string
    medium: string
    small: string
    grid: string
  }
  title: string
  comment: string
  tags: string[]
  spoiler: boolean
  createdAt: number
  updatedAt: number
  lastPost: number
}

export type MonoPhotoPage = P1Page<MonoPhoto>
export type MonoPhotoComments = Comment[]
