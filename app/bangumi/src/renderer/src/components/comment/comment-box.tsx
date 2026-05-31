import {
  BangumiSmile,
  REACTION_VALUE_TO_BANGUMI_SMILE,
} from '@renderer/components/comment/bangumi-smile'
import { BBCodeImagePreviewProvider } from '@renderer/components/comment/bbcode-image'
import { ViewTransitionImage } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { Comment, CommentBase, CommentReaction } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import dayjs from 'dayjs'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { useLocation, useViewTransitionState } from 'react-router-dom'

const DEFAULT_COMMENT_PLACEHOLDER_COUNT = 6
const DEFAULT_VISIBLE_REPLY_COUNT = 3

type CommentBoxProps = {
  title?: ReactNode
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
}

export function CommentBox({
  title = '吐槽箱',
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
}: CommentBoxProps) {
  const visibleComments = useMemo(() => comments?.filter(hasVisibleCommentContent), [comments])
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
        comments={visibleComments}
        className={listClassName}
        appendPlaceholderCount={appendPlaceholderCount}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onNearBottom={onListNearBottom}
        showBackToTop={showBackToTop}
        floorNumbers={visibleFloorNumbers}
        scrollAreaKey={scrollAreaKey}
        userAvatarViewTransition={userAvatarViewTransition}
        virtual={virtual}
      />
    )
  }, [
    emptyText,
    error,
    appendPlaceholderCount,
    hasMore,
    isFetchingMore,
    listClassName,
    onListNearBottom,
    showBackToTop,
    visibleFloorNumbers,
    scrollAreaKey,
    virtual,
    visibleComments,
    userAvatarViewTransition,
  ])

  return (
    <section ref={ref} className={cn('flex flex-col gap-5', className)}>
      {title !== null && (
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-medium">{title}</h2>
          {visibleComments && visibleComments.length > 0 && (
            <span className="text-muted-foreground text-sm">{visibleComments.length}</span>
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

function CommentList({
  comments,
  className,
  appendPlaceholderCount = DEFAULT_COMMENT_PLACEHOLDER_COUNT,
  hasMore,
  isFetchingMore,
  onNearBottom,
  showBackToTop,
  floorNumbers,
  scrollAreaKey,
  userAvatarViewTransition,
  virtual,
}: {
  comments: Comment[]
  className?: string
  appendPlaceholderCount?: number
  hasMore?: boolean
  isFetchingMore?: boolean
  onNearBottom?: () => Promise<unknown> | void
  showBackToTop?: boolean
  floorNumbers?: number[]
  scrollAreaKey?: string
  userAvatarViewTransition: boolean
  virtual: boolean
}) {
  if (!virtual) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {comments.map((comment, index) => (
          <CommentItem
            comment={comment}
            floorNumber={floorNumbers?.[index] ?? index + 1}
            key={comment.id}
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
          userAvatarViewTransition={userAvatarViewTransition}
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
      scrollAreaKey={scrollAreaKey}
      showBackToTop={showBackToTop}
    />
  )
}

function CommentSkeletonList({ count = 4 }: { count?: number }) {
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

export function CommentItem({
  comment,
  floorNumber,
  userAvatarViewTransition,
}: {
  comment: Comment
  floorNumber: number
  userAvatarViewTransition: boolean
}) {
  const [showAllReplies, setShowAllReplies] = useState(false)
  const allVisibleReplies = useMemo(
    () => comment.replies.filter(hasVisibleReplyContent),
    [comment.replies],
  )
  const replyCount = allVisibleReplies.length
  const hasHiddenReplies = replyCount > DEFAULT_VISIBLE_REPLY_COUNT
  const visibleReplies =
    hasHiddenReplies && !showAllReplies
      ? allVisibleReplies.slice(0, DEFAULT_VISIBLE_REPLY_COUNT)
      : allVisibleReplies
  const hiddenReplyCount = replyCount - DEFAULT_VISIBLE_REPLY_COUNT
  const repliesId = `comment-${comment.id}-replies`
  const hasContent = comment.content.trim().length > 0

  return (
    <Card className="relative flex flex-row gap-3 p-3 pr-12 shadow-none">
      <span className="text-muted-foreground absolute top-3 right-3 text-xs tabular-nums">
        #{floorNumber}
      </span>
      {comment.user?.avatar.medium ? (
        <CommentUserAvatarLink
          className="size-10 shrink-0"
          imageClassName="size-10 overflow-hidden rounded-full"
          transitionKey={`comment-${comment.id}`}
          user={comment.user}
          viewTransition={userAvatarViewTransition}
        />
      ) : (
        <div className="bg-muted size-10 shrink-0 rounded-full" />
      )}
      <BBCodeImagePreviewProvider>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <CommentHeader comment={comment} />
          {hasContent && (
            <div className="bbcode text-sm whitespace-pre-line">
              {renderBBCode(comment.content)}
            </div>
          )}
          <CommentReactions reactions={comment.reactions} />
          {replyCount > 0 && (
            <div
              className="border-border/60 bg-muted/25 divide-border flex flex-col divide-y rounded-md border px-2"
              id={repliesId}
            >
              {visibleReplies.map((reply) => (
                <ReplyItem
                  reply={reply}
                  key={reply.id}
                  userAvatarViewTransition={userAvatarViewTransition}
                />
              ))}
            </div>
          )}
          {hasHiddenReplies && (
            <Button
              aria-controls={repliesId}
              aria-expanded={showAllReplies}
              className="text-muted-foreground hover:text-foreground -ml-2 h-7 w-fit px-2 text-xs"
              onClick={() => setShowAllReplies((value) => !value)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {showAllReplies ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
              {showAllReplies ? '收起回复' : `展开剩余 ${hiddenReplyCount} 条回复`}
            </Button>
          )}
        </div>
      </BBCodeImagePreviewProvider>
    </Card>
  )
}

function CommentHeader({ comment }: { comment: Comment }) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1">
      {comment.user ? (
        <>
          <UserProfileLink
            className="hover:text-primary font-medium transition-colors"
            user={comment.user}
          >
            {comment.user.nickname}
          </UserProfileLink>
          <CommentUserSignature sign={comment.user.sign} />
        </>
      ) : (
        <span className="font-medium">#{comment.creatorID}</span>
      )}
      <span className="text-muted-foreground text-xs">
        <time
          dateTime={dayjs.unix(comment.createdAt).toISOString()}
          title={dayjs.unix(comment.createdAt).format('YYYY-MM-DD HH:mm')}
        >
          {formatRecentUnixTime(comment.createdAt)}
        </time>
      </span>
    </div>
  )
}

function ReplyItem({
  reply,
  userAvatarViewTransition,
}: {
  reply: CommentBase
  userAvatarViewTransition: boolean
}) {
  return (
    <div className="flex flex-row gap-2 py-2.5 text-sm first:pt-2 last:pb-2">
      {reply.user?.avatar.medium ? (
        <CommentUserAvatarLink
          className="mt-0.5 size-7 shrink-0"
          imageClassName="size-7 overflow-hidden rounded-full"
          transitionKey={`reply-${reply.id}`}
          user={reply.user}
          viewTransition={userAvatarViewTransition}
        />
      ) : (
        <div className="bg-muted mt-0.5 size-7 shrink-0 rounded-full" />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-row flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {reply.user ? (
            <>
              <UserProfileLink
                className="hover:text-primary font-medium transition-colors"
                user={reply.user}
              >
                {reply.user.nickname}
              </UserProfileLink>
              <CommentUserSignature sign={reply.user.sign} />
            </>
          ) : (
            <span className="font-medium">#{reply.creatorID}</span>
          )}
          <span className="text-muted-foreground text-xs">
            <time
              dateTime={dayjs.unix(reply.createdAt).toISOString()}
              title={dayjs.unix(reply.createdAt).format('YYYY-MM-DD HH:mm')}
            >
              {formatRecentUnixTime(reply.createdAt)}
            </time>
          </span>
        </div>
        <div className="bbcode whitespace-pre-line">{renderBBCode(reply.content)}</div>
        <CommentReactions reactions={reply.reactions} compact />
      </div>
    </div>
  )
}

export function CommentUserSignature({ sign }: { sign?: string }) {
  const normalizedSign = sign?.trim()
  if (!normalizedSign) return null

  return (
    <span className="text-muted-foreground min-w-0 text-xs font-normal break-words whitespace-normal">
      ({normalizedSign})
    </span>
  )
}

function UserProfileLink({
  children,
  className,
  user,
  viewTransitionName,
}: {
  children: ReactNode
  className?: string
  user: NonNullable<CommentBase['user']>
  viewTransitionName?: string
}) {
  return (
    <MyLink
      className={className}
      state={viewTransitionName ? { viewTransitionName } : undefined}
      to={`/user/${encodeURIComponent(user.username)}`}
      viewTransition={!!viewTransitionName}
    >
      {children}
    </MyLink>
  )
}

function CommentUserAvatarLink({
  className,
  imageClassName,
  transitionKey,
  user,
  viewTransition,
}: {
  className?: string
  imageClassName?: string
  transitionKey: string
  user: NonNullable<CommentBase['user']>
  viewTransition: boolean
}) {
  const { key } = useLocation()
  const to = `/user/${encodeURIComponent(user.username)}`
  const isTransitioning = useViewTransitionState(to)
  const viewTransitionName = `user-avatar-${user.id}-${transitionKey}-${key}`

  return (
    <UserProfileLink
      className={className}
      user={user}
      viewTransitionName={viewTransition ? viewTransitionName : undefined}
    >
      <ViewTransitionImage
        active={viewTransition && isTransitioning}
        cacheKey={`commentUserAvatar-${transitionKey}`}
        className={imageClassName}
        imageSrc={user.avatar.medium}
        viewTransitionName={viewTransitionName}
      />
    </UserProfileLink>
  )
}

function CommentReactions({
  reactions,
  compact = false,
}: {
  reactions?: CommentReaction[]
  compact?: boolean
}) {
  const visibleReactions = useMemo(
    () => reactions?.filter((reaction) => reaction.users.length > 0) ?? [],
    [reactions],
  )

  if (visibleReactions.length === 0) return null

  return (
    <div className={cn('flex flex-row flex-wrap gap-1.5', compact ? 'mt-1' : 'mt-0.5')}>
      {visibleReactions.map((reaction) => {
        const smileCode = REACTION_VALUE_TO_BANGUMI_SMILE[reaction.value]
        const userNames = reaction.users.map((user) => user.nickname || user.username).join('、')

        return (
          <Tooltip key={reaction.value}>
            <TooltipTrigger asChild>
              <span className="border-border/70 bg-muted/30 hover:bg-muted/60 inline-flex h-[25px] items-center gap-1 rounded-full border px-1.5 text-xs leading-none transition-colors">
                {smileCode ? (
                  <BangumiSmile code={smileCode} variant="reaction" />
                ) : (
                  <span className="text-muted-foreground tabular-nums">{reaction.value}</span>
                )}
                <span className="text-muted-foreground tabular-nums">{reaction.users.length}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 leading-5" sideOffset={6}>
              {userNames}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
