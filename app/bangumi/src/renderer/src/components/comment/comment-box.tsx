import { MasonryInfiniteGrid } from '@egjs/react-infinitegrid'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { Image } from '@renderer/components/image/image'
import { BackToTopButton } from '@renderer/components/button/back-to-top'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Comment, CommentBase } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

const DEFAULT_COMMENT_PLACEHOLDER_COUNT = 6

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
  virtualGroupKeys?: number[]
  floorNumbers?: number[]
  showBackToTop?: boolean
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
  virtualGroupKeys,
  floorNumbers,
  showBackToTop = false,
  footer,
}: CommentBoxProps) {
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

    if (comments === undefined) {
      return (
        <div className="flex flex-col gap-3">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <Skeleton className="h-24 rounded-lg" key={index} />
            ))}
        </div>
      )
    }

    if (comments.length === 0) {
      return <p className="text-muted-foreground text-sm">{emptyText}</p>
    }

    return (
      <CommentList
        comments={comments}
        className={listClassName}
        appendPlaceholderCount={appendPlaceholderCount}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onNearBottom={onListNearBottom}
        showBackToTop={showBackToTop}
        floorNumbers={floorNumbers}
        virtualGroupKeys={virtualGroupKeys}
        virtual={virtual}
      />
    )
  }, [
    comments,
    emptyText,
    error,
    appendPlaceholderCount,
    hasMore,
    isFetchingMore,
    listClassName,
    onListNearBottom,
    showBackToTop,
    floorNumbers,
    virtualGroupKeys,
    virtual,
  ])

  return (
    <section ref={ref} className={cn('flex flex-col gap-5', className)}>
      {title !== null && (
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-medium">{title}</h2>
          {comments && comments.length > 0 && (
            <span className="text-muted-foreground text-sm">{comments.length}</span>
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

function CommentList({
  comments,
  className,
  appendPlaceholderCount = DEFAULT_COMMENT_PLACEHOLDER_COUNT,
  hasMore,
  isFetchingMore,
  onNearBottom,
  showBackToTop,
  floorNumbers,
  virtualGroupKeys,
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
  virtualGroupKeys?: number[]
  virtual: boolean
}) {
  const loadingMoreRef = useRef(false)
  const viewportRef = useRef<HTMLElement | null>(null)
  const [viewport, setViewport] = useState<HTMLElement | null>(null)

  if (!virtual) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {comments.map((comment, index) => (
          <CommentItem
            comment={comment}
            floorNumber={floorNumbers?.[index] ?? index + 1}
            key={comment.id}
          />
        ))}
      </div>
    )
  }

  return (
    <ScrollArea.Root className="group/scroll relative h-full min-h-0 overflow-hidden">
      <MasonryInfiniteGrid
        tag={ScrollArea.Viewport as unknown as string}
        container
        containerTag={ScrollArea.Content as unknown as string}
        className={cn('max-h-[40rem] w-full overflow-x-hidden overflow-y-auto pr-2', className)}
        useResizeObserver
        observeChildren
        placeholder={<CommentSkeleton />}
        align="stretch"
        maxStretchColumnSize={9999}
        gap={12}
        onRequestAppend={(event) => {
          if (!hasMore || isFetchingMore || loadingMoreRef.current || !onNearBottom) return

          loadingMoreRef.current = true
          event.wait()
          event.currentTarget.appendPlaceholders(
            appendPlaceholderCount,
            (+event.groupKey! || 0) + 1,
          )
          Promise.resolve(onNearBottom()).finally(() => {
            loadingMoreRef.current = false
            event.ready()
          })
        }}
        onScroll={(event) => {
          const nextViewport = event.currentTarget
          if (viewportRef.current === nextViewport) return

          viewportRef.current = nextViewport
          setViewport(nextViewport)
        }}
      >
        {comments.map((comment, index) => (
          <div
            key={comment.id}
            data-grid-groupkey={
              virtualGroupKeys?.[index] ?? Math.floor(index / appendPlaceholderCount)
            }
          >
            <CommentItem
              comment={comment}
              floorNumber={floorNumbers?.[index] ?? index + 1}
              key={comment.id}
            />
          </div>
        ))}
      </MasonryInfiniteGrid>
      {showBackToTop && (
        <BackToTopButton className="absolute right-3 bottom-3 size-9" viewport={viewport} />
      )}
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

function CommentSkeleton() {
  return (
    <div className="flex w-full flex-row gap-3 p-2">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

function CommentItem({ comment, floorNumber }: { comment: Comment; floorNumber: number }) {
  return (
    <Card className="relative flex flex-row gap-3 p-3 pr-12 shadow-none">
      <span className="text-muted-foreground absolute top-3 right-3 text-xs tabular-nums">
        #{floorNumber}
      </span>
      {comment.user?.avatar.medium ? (
        <Image
          imageSrc={comment.user.avatar.medium}
          className="size-10 shrink-0 overflow-hidden rounded-full"
        />
      ) : (
        <div className="bg-muted size-10 shrink-0 rounded-full" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <CommentHeader comment={comment} />
        <div className="bbcode text-sm leading-6 whitespace-pre-line">
          {renderBBCode(comment.content)}
        </div>
        {comment.replies.length > 0 && (
          <div className="bg-muted/40 flex flex-col gap-2 rounded-md p-2">
            {comment.replies.map((reply) => (
              <ReplyItem reply={reply} key={reply.id} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function CommentHeader({ comment }: { comment: Comment }) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-medium">{comment.user?.nickname ?? `#${comment.creatorID}`}</span>
      <span className="text-muted-foreground text-xs">
        {dayjs.unix(comment.createdAt).format('YYYY-MM-DD HH:mm')}
      </span>
    </div>
  )
}

function ReplyItem({ reply }: { reply: CommentBase }) {
  return (
    <div className="text-sm">
      <span className="font-medium">{reply.user?.nickname ?? `#${reply.creatorID}`}</span>
      <span className="text-muted-foreground mx-1">
        {dayjs.unix(reply.createdAt).format('YYYY-MM-DD HH:mm')}
      </span>
      <span className="bbcode whitespace-pre-line">{renderBBCode(reply.content)}</span>
    </div>
  )
}
