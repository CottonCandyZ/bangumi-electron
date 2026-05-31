import { nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { CommentReactionUser } from '@renderer/data/types/comment'
import type { ReplyTarget } from '@shared/reply'

export const COMMON_REACTION_VALUES = [0, 79, 54, 140, 62, 122, 104, 80, 141, 88, 85, 90]
export const SUBJECT_COLLECT_REACTION_VALUES = [0, 104, 54, 140, 122, 90, 88, 80]

export type ReactionTarget =
  | ReplyTarget
  | {
      id: number | string
      title?: string
      type: 'subject-collect'
    }

export type ToggleReactionInput = {
  active: boolean
  commentId: number
  target: ReactionTarget
  user?: CommentReactionUser
  value: number
}

type ReactionInput = Omit<ToggleReactionInput, 'active'>

export async function toggleReaction({ active, ...input }: ToggleReactionInput) {
  if (active) {
    return await deleteReaction(input)
  }

  return await addReaction(input)
}

export function canReact(target: ReactionTarget | undefined) {
  return !!target && getReactionPath(target, 0) !== null
}

export function getAvailableReactionValues(target: ReactionTarget | undefined) {
  if (!target) return []

  switch (target.type) {
    case 'subject-collect':
      return SUBJECT_COLLECT_REACTION_VALUES
    case 'group-topic':
    case 'subject-topic':
    case 'episode':
      return COMMON_REACTION_VALUES
    case 'person':
    case 'character':
    case 'timeline':
    case 'blog':
    case 'index':
      return []
  }
}

async function addReaction({ commentId, target, value }: ReactionInput) {
  const path = getReactionPath(target, commentId)
  if (!path) throw new Error('当前评论类型暂不支持贴贴')

  return await nextFetchWithOptionalAuth<Record<string, never>>(path, {
    method: 'PUT',
    body: { value },
  })
}

async function deleteReaction({ commentId, target }: ReactionInput) {
  const path = getReactionPath(target, commentId)
  if (!path) throw new Error('当前评论类型暂不支持贴贴')

  return await nextFetchWithOptionalAuth<Record<string, never>>(path, {
    method: 'DELETE',
  })
}

function getReactionPath(target: ReactionTarget, commentId: number) {
  switch (target.type) {
    case 'group-topic':
      return `/p1/groups/-/posts/${commentId}/like`
    case 'subject-topic':
      return `/p1/subjects/-/posts/${commentId}/like`
    case 'episode':
      return `/p1/episodes/-/comments/${commentId}/like`
    case 'subject-collect':
      return `/p1/subjects/-/collects/${commentId}/like`
    case 'person':
    case 'character':
    case 'timeline':
    case 'blog':
    case 'index':
      return null
  }
}
