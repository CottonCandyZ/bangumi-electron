import { Comment, SubjectInterestComment } from '@renderer/data/types/comment'
import type { SubjectType } from '@renderer/data/types/subject'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'

export function toCommentFromSubjectInterest(
  comment: SubjectInterestComment,
  subjectType?: SubjectType,
): Comment {
  return {
    id: comment.id,
    mainID: comment.id,
    creatorID: comment.user?.id ?? 0,
    relatedID: 0,
    createdAt: comment.updatedAt,
    content: comment.comment,
    state: 0,
    reactions: comment.reactions,
    rate: comment.rate,
    collectionType: comment.type,
    collectionLabel: subjectType ? COLLECTION_TYPE_MAP(subjectType)[comment.type] : undefined,
    user: comment.user,
    replies: [],
  }
}
