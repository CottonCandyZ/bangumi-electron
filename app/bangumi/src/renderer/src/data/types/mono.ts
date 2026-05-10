import { Images, InfoBoxValueList, Stat } from '@renderer/data/types/bgm'
import { Comment, CommentBase, CommentUser } from '@renderer/data/types/comment'
import { SubjectType } from '@renderer/data/types/subject'

export type MonoType = 'person' | 'character'

export type MonoInfoBox = {
  key: string
  value: string | InfoBoxValueList[]
}

export type MonoDetail = {
  id: string
  type: MonoType
  name: string
  typeLabel: string
  summary: string
  images?: Images | null
  infobox: MonoInfoBox[]
  stat: Stat
  badges: string[]
}

export type MonoSubjectItem = {
  id: number
  name: string
  nameCn: string
  image?: string
  subjectType: SubjectType
  relation: string
  relatedItems?: MonoRelatedItem[]
}

export type MonoRelatedItem = {
  id: number | string
  name: string
  image?: string
  link: string
  subjectId?: number
  subjectName?: string
  subjectNameCn?: string
  subjectType?: SubjectType
  relation?: string
}

export type MonoCommentUser = CommentUser

export type MonoCommentBase = CommentBase

export type MonoComment = Comment
