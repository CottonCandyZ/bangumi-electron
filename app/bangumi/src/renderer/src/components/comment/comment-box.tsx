import { Image } from '@renderer/components/image/image'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Comment, CommentBase } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

const VIRTUAL_ITEM_HEIGHT = 156
const VIRTUAL_OVERSCAN = 4

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
  onListNearBottom?: () => void
  listNearBottomThreshold?: number
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
  listNearBottomThreshold,
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
        onNearBottom={onListNearBottom}
        nearBottomThreshold={listNearBottomThreshold}
        virtual={virtual}
      />
    )
  }, [
    comments,
    emptyText,
    error,
    listClassName,
    listNearBottomThreshold,
    onListNearBottom,
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
  nearBottomThreshold,
  onNearBottom,
  virtual,
}: {
  comments: Comment[]
  className?: string
  onNearBottom?: () => void
  nearBottomThreshold?: number
  virtual: boolean
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const nearBottomThresholdPx = nearBottomThreshold ?? 160

  const notifyIfNearBottom = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !onNearBottom) return

    const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    if (distanceToBottom <= nearBottomThresholdPx) onNearBottom()
  }, [nearBottomThresholdPx, onNearBottom])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateHeight = () => setViewportHeight(viewport.clientHeight)
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!virtual) return
    notifyIfNearBottom()
  }, [comments.length, notifyIfNearBottom, virtual])

  if (!virtual) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {comments.map((comment) => (
          <CommentItem comment={comment} key={comment.id} />
        ))}
      </div>
    )
  }

  const start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN)
  const end = Math.min(
    comments.length,
    Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ITEM_HEIGHT) + VIRTUAL_OVERSCAN,
  )
  const visibleComments = comments.slice(start, end)
  const topHeight = start * VIRTUAL_ITEM_HEIGHT
  const bottomHeight = Math.max(0, (comments.length - end) * VIRTUAL_ITEM_HEIGHT)

  return (
    <div
      ref={viewportRef}
      className={cn('max-h-[40rem] overflow-y-auto pr-2', className)}
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop)
        notifyIfNearBottom()
      }}
    >
      <div style={{ height: topHeight }} />
      <div className="flex flex-col gap-3">
        {visibleComments.map((comment) => (
          <CommentItem comment={comment} key={comment.id} />
        ))}
      </div>
      <div style={{ height: bottomHeight }} />
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <Card className="flex flex-row gap-3 p-3 shadow-none">
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
