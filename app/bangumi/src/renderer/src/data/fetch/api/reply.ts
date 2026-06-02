import { nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import {
  createWebTopicReply,
  deleteWebTopicReply,
  updateWebTopicReply,
} from '@renderer/data/fetch/web/reply'
import type { ReplyTarget } from '@shared/reply'
import { FetchError } from 'ofetch'

export type CreateReplyInput = {
  content: string
  replyTo?: number
  replyToRoot?: number
  target: ReplyTarget
  turnstileToken: string
}

export type CreateReplyResponse = {
  id: number
}

export type DeleteReplyInput = {
  commentId: number
  target: ReplyTarget
}

export type UpdateReplyInput = DeleteReplyInput & {
  content: string
}

export async function createReply({
  content,
  replyTo = 0,
  replyToRoot,
  target,
  turnstileToken,
}: CreateReplyInput) {
  const kind = target.type === 'group-topic' ? 'group' : 'subject'
  const isTopicReply = target.type === 'group-topic' || target.type === 'subject-topic'
  const shouldUseWebNestedTopicReply = isTopicReply && !!replyToRoot && replyToRoot !== replyTo

  if (shouldUseWebNestedTopicReply) {
    return await createWebTopicReply({
      content,
      kind,
      replyTo,
      topicId: Number(target.id),
    })
  }

  try {
    return await nextFetchWithOptionalAuth<CreateReplyResponse>(getReplyPath(target), {
      method: 'POST',
      body: {
        content,
        replyTo,
        turnstileToken,
      },
    })
  } catch (error) {
    if (!shouldUseWebTopicReply({ error, target })) {
      throw error
    }

    return await createWebTopicReply({
      content,
      kind,
      replyTo,
      topicId: Number(target.id),
    })
  }
}

export async function deleteReply({ commentId, target }: DeleteReplyInput) {
  const path = getDeleteReplyPath(target, commentId)
  if (!path) throw new Error('当前评论类型暂不支持删除')

  try {
    return await nextFetchWithOptionalAuth<Record<string, never>>(path, {
      method: 'DELETE',
    })
  } catch (error) {
    if (!shouldUseWebTopicReply({ error, target })) {
      throw error
    }

    return await deleteWebTopicReply({
      commentId,
      kind: target.type === 'group-topic' ? 'group' : 'subject',
      topicId: Number(target.id),
    })
  }
}

export async function updateReply({ commentId, content, target }: UpdateReplyInput) {
  const path = getUpdateReplyPath(target, commentId)
  if (!path) throw new Error('当前评论类型暂不支持编辑')

  try {
    return await nextFetchWithOptionalAuth<Record<string, never>>(path, {
      method: 'PUT',
      body: {
        content,
      },
    })
  } catch (error) {
    if (!shouldUseWebTopicReply({ error, target })) {
      throw error
    }

    return await updateWebTopicReply({
      commentId,
      content,
      kind: target.type === 'group-topic' ? 'group' : 'subject',
      topicId: Number(target.id),
    })
  }
}

export function canDeleteReply(target: ReplyTarget) {
  return getDeleteReplyPath(target, 0) !== null
}

export function canEditReply(target: ReplyTarget) {
  return getUpdateReplyPath(target, 0) !== null
}

function getReplyPath(target: ReplyTarget) {
  switch (target.type) {
    case 'group-topic':
      return `/p1/groups/-/topics/${target.id}/replies`
    case 'subject-topic':
      return `/p1/subjects/-/topics/${target.id}/replies`
    case 'episode':
      return `/p1/episodes/${target.id}/comments`
    case 'person':
      return `/p1/persons/${target.id}/comments`
    case 'character':
      return `/p1/characters/${target.id}/comments`
    case 'timeline':
      return `/p1/timeline/${target.id}/replies`
    case 'blog':
      return `/p1/blogs/${target.id}/comments`
    case 'index':
      return `/p1/indexes/${target.id}/comments`
  }
}

function getDeleteReplyPath(target: ReplyTarget, commentId: number) {
  switch (target.type) {
    case 'group-topic':
      return `/p1/groups/-/posts/${commentId}`
    case 'subject-topic':
      return `/p1/subjects/-/posts/${commentId}`
    case 'episode':
      return `/p1/episodes/-/comments/${commentId}`
    case 'person':
      return `/p1/persons/-/comments/${commentId}`
    case 'character':
      return `/p1/characters/-/comments/${commentId}`
    case 'timeline':
      return null
    case 'blog':
      return `/p1/blogs/-/comments/${commentId}`
    case 'index':
      return `/p1/indexes/-/comments/${commentId}`
  }
}

function getUpdateReplyPath(target: ReplyTarget, commentId: number) {
  switch (target.type) {
    case 'group-topic':
      return `/p1/groups/-/posts/${commentId}`
    case 'subject-topic':
      return `/p1/subjects/-/posts/${commentId}`
    case 'episode':
      return `/p1/episodes/-/comments/${commentId}`
    case 'person':
      return `/p1/persons/-/comments/${commentId}`
    case 'character':
      return `/p1/characters/-/comments/${commentId}`
    case 'timeline':
      return null
    case 'blog':
      return `/p1/blogs/-/comments/${commentId}`
    case 'index':
      return `/p1/indexes/-/comments/${commentId}`
  }
}

function shouldUseWebTopicReply({ error, target }: { error: unknown; target: ReplyTarget }) {
  if (target.type !== 'group-topic' && target.type !== 'subject-topic') return false
  return (
    error instanceof FetchError && typeof error.statusCode === 'number' && error.statusCode >= 500
  )
}
