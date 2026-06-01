import { CommentReplyButton } from '@renderer/components/comment/comment-reply-button'
import {
  CommentList,
  CommentSkeletonList,
  DEFAULT_COMMENT_PLACEHOLDER_COUNT,
} from '@renderer/components/comment/comment-list'
import type { ReactionTarget } from '@renderer/data/fetch/api/reaction'
import type { Comment, CommentBase } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import type { ReplyTarget } from '@shared/reply'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

export { CommentItem } from './comment-item'
export { CommentSkeleton } from './comment-list'
export { CommentUserSignature, CommentUserUsername } from './comment-user'

type CommentBoxProps = {
  title?: ReactNode
  titleCount?: number
  comments?: Comment[]
  error?: boolean
  emptyText?: string
  loadingText?: string
  className?: string
  contentClassName?: string
  listClassName?: string
  framed?: boolean
  virtual?: boolean
  onInView?: () => void
  onListNearBottom?: () => Promise<unknown> | void
  hasMore?: boolean
  isFetchingMore?: boolean
  appendPlaceholderCount?: number
  floorNumbers?: number[]
  scrollAreaKey?: string
  showBackToTop?: boolean
  userAvatarViewTransition?: boolean
  footer?: ReactNode
  reactionTarget?: ReactionTarget
  replyTarget?: ReplyTarget
  showReplyEntry?: boolean
}

export function CommentBox({
  title = '吐槽箱',
  titleCount,
  comments,
  error,
  emptyText = '还没有吐槽。',
  className,
  contentClassName,
  listClassName,
  framed = false,
  virtual = false,
  onInView,
  onListNearBottom,
  hasMore = false,
  isFetchingMore = false,
  appendPlaceholderCount = DEFAULT_COMMENT_PLACEHOLDER_COUNT,
  floorNumbers,
  scrollAreaKey,
  showBackToTop = false,
  userAvatarViewTransition = true,
  footer,
  reactionTarget,
  replyTarget,
  showReplyEntry = true,
}: CommentBoxProps) {
  const resolvedReactionTarget = reactionTarget ?? replyTarget
  const visibleComments = useMemo(() => comments?.filter(hasVisibleCommentContent), [comments])
  const visibleTitleCount = titleCount ?? visibleComments?.length
  const visibleFloorNumbers = useMemo(() => {
    if (!comments || !floorNumbers) return floorNumbers
    return comments.flatMap((comment, index) =>
      hasVisibleCommentContent(comment) ? [floorNumbers[index] ?? index + 1] : [],
    )
  }, [comments, floorNumbers])
  const { ref, inView } = useInView({
    rootMargin: '240px 0px',
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView) onInView?.()
  }, [inView, onInView])

  const content = useMemo(() => {
    if (error) {
      return <p className="text-muted-foreground text-sm">暂时无法读取吐槽箱。</p>
    }

    if (visibleComments === undefined) {
      return <CommentSkeletonList />
    }

    if (visibleComments.length === 0) {
      return <p className="text-muted-foreground text-sm">{emptyText}</p>
    }

    return (
      <CommentList
        appendPlaceholderCount={appendPlaceholderCount}
        className={listClassName}
        comments={visibleComments}
        floorNumbers={visibleFloorNumbers}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onNearBottom={onListNearBottom}
        reactionTarget={resolvedReactionTarget}
        replyTarget={replyTarget}
        scrollAreaKey={scrollAreaKey}
        showBackToTop={showBackToTop}
        userAvatarViewTransition={userAvatarViewTransition}
        virtual={virtual}
      />
    )
  }, [
    appendPlaceholderCount,
    emptyText,
    error,
    hasMore,
    isFetchingMore,
    listClassName,
    onListNearBottom,
    replyTarget,
    resolvedReactionTarget,
    scrollAreaKey,
    showBackToTop,
    userAvatarViewTransition,
    virtual,
    visibleComments,
    visibleFloorNumbers,
  ])

  return (
    <section ref={ref} className={cn('flex flex-col gap-5', className)}>
      {title !== null && (
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-medium">{title}</h2>
          {visibleTitleCount !== undefined && visibleTitleCount > 0 && (
            <span className="text-muted-foreground text-sm">{visibleTitleCount}</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'min-h-0',
          framed && 'bg-background/60 rounded-lg border p-3',
          contentClassName,
        )}
      >
        {content}
      </div>
      {replyTarget && showReplyEntry && (
        <div className="-mt-2 flex justify-end">
          <CommentReplyButton label="评论" target={replyTarget} />
        </div>
      )}
      {footer}
    </section>
  )
}

export function hasVisibleCommentContent(comment: Comment) {
  return comment.content.trim().length > 0 || comment.replies.some(hasVisibleReplyContent)
}

function hasVisibleReplyContent(reply: CommentBase) {
  return reply.content.trim().length > 0
}
