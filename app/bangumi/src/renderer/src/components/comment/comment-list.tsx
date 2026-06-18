import { CommentItem } from '@renderer/components/comment/comment-item'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import type { ReactionTarget } from '@renderer/data/fetch/api/reaction'
import type { Comment } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import type { ReplyTarget } from '@shared/reply'

export const DEFAULT_COMMENT_PLACEHOLDER_COUNT = 6

export function CommentList({
  comments,
  className,
  appendPlaceholderCount = DEFAULT_COMMENT_PLACEHOLDER_COUNT,
  hasMore,
  isFetchingMore,
  onNearBottom,
  showBackToTop,
  floorNumbers,
  scrollMemoryKey,
  userAvatarViewTransition,
  virtual,
  reactionTarget,
  replyTarget,
}: {
  comments: Comment[]
  className?: string
  appendPlaceholderCount?: number
  hasMore?: boolean
  isFetchingMore?: boolean
  onNearBottom?: () => Promise<unknown> | void
  showBackToTop?: boolean
  floorNumbers?: number[]
  scrollMemoryKey?: string
  userAvatarViewTransition: boolean
  virtual: boolean
  reactionTarget?: ReactionTarget
  replyTarget?: ReplyTarget
}) {
  if (!virtual) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {comments.map((comment, index) => (
          <CommentItem
            comment={comment}
            floorNumber={floorNumbers?.[index] ?? index + 1}
            key={comment.id}
            reactionTarget={reactionTarget}
            replyTarget={replyTarget}
            userAvatarViewTransition={userAvatarViewTransition}
          />
        ))}
      </div>
    )
  }

  return (
    <SingleColumnVirtualList
      items={comments}
      getKey={(comment) => comment.id}
      renderItem={(comment, index) => (
        <CommentItem
          comment={comment}
          floorNumber={floorNumbers?.[index] ?? index + 1}
          reactionTarget={reactionTarget}
          replyTarget={replyTarget}
          userAvatarViewTransition={userAvatarViewTransition}
          virtual
        />
      )}
      rootClassName="h-full"
      className={cn('max-h-[40rem] pr-2', className)}
      estimateSize={132}
      gap={12}
      hasMore={hasMore}
      isFetchingMore={isFetchingMore}
      appendPlaceholderCount={appendPlaceholderCount}
      renderPlaceholder={() => <CommentSkeleton />}
      onNearBottom={onNearBottom}
      scrollMemoryKey={scrollMemoryKey}
      showBackToTop={showBackToTop}
    />
  )
}

export function CommentSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <CommentSkeleton key={index} />
        ))}
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex w-full flex-row gap-3 p-2">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}
