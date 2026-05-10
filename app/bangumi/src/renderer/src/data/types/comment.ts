export type CommentUser = {
  id: number
  username: string
  nickname: string
  avatar: {
    small: string
    medium: string
    large: string
  }
}

export type CommentBase = {
  id: number
  mainID: number
  creatorID: number
  relatedID: number
  relatedPhotoID?: number
  createdAt: number
  content: string
  state: number
  user?: CommentUser
}

export type Comment = CommentBase & {
  replies: CommentBase[]
}

export type SubjectInterestComment = {
  id: number
  user: CommentUser
  type: number
  rate: number
  comment: string
  updatedAt: number
}

export type SubjectInterestComments = {
  data: SubjectInterestComment[]
  total: number
}
