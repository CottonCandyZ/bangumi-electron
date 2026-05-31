import { Comment, SubjectInterestComment } from '@renderer/data/types/comment'

export function toCommentFromSubjectInterest(comment: SubjectInterestComment): Comment {
  return {
    id: comment.id,
    mainID: comment.id,
    creatorID: comment.user?.id ?? 0,
    relatedID: 0,
    createdAt: comment.updatedAt,
    content: comment.comment,
    state: 0,
    reactions: comment.reactions,
    user: comment.user,
    replies: [],
  }
}
