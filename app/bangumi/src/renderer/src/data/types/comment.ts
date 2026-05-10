export type CommentUser = {
  id: number
  username: string
  nickname: string
  avatar: {
    small: string
    medium: string
    large: string
  }
  group: number
  sign: string
  joinedAt: number
}

export type CommentReactionUser = {
  id: number
  username: string
  nickname: string
}

export type CommentReaction = {
  users: CommentReactionUser[]
  value: number
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
  reactions?: CommentReaction[]
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
