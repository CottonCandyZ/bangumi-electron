import { ScrollArea } from '@base-ui/react/scroll-area'
import { CommentBox } from '@renderer/components/comment/comment-box'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectCommentsQuery } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Comment } from '@renderer/data/types/comment'
import { useCallback, useEffect, useMemo, useRef } from 'react'

const LOAD_MORE_THRESHOLD_PX = 160

export function SubjectCommentsPanel({
  subjectId,
  enabled,
}: {
  subjectId: SubjectId
  enabled: boolean
}) {
  const commentsQuery = useSubjectCommentsQuery({
    id: subjectId,
    enabled,
    limit: 20,
  })
  const viewportRef = useRef<HTMLDivElement>(null)
  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data.map(toComment)),
    [commentsQuery.data],
  )
  const total = commentsQuery.data?.pages.at(-1)?.total
  const loadMore = useCallback(() => {
    if (commentsQuery.isError || !commentsQuery.hasNextPage || commentsQuery.isFetchingNextPage) {
      return
    }

    commentsQuery.fetchNextPage()
  }, [commentsQuery])
  const maybeLoadMore = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    if (distanceToBottom <= LOAD_MORE_THRESHOLD_PX) loadMore()
  }, [loadMore])

  useEffect(() => {
    if (!enabled || comments === undefined) return
    maybeLoadMore()
  }, [comments?.length, enabled, maybeLoadMore])

  if (!enabled) return null

  if (comments === undefined && !commentsQuery.isError) {
    return (
      <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
        {Array(8)
          .fill(undefined)
          .map((_, index) => (
            <CommentSkeleton key={index} />
          ))}
      </div>
    )
  }

  return (
    <ScrollArea.Root className="group/scroll relative h-full min-h-0 w-full overflow-hidden">
      <ScrollArea.Viewport
        ref={viewportRef}
        className="h-full w-full overflow-x-hidden px-2 py-3 focus-visible:outline-hidden"
        onScroll={maybeLoadMore}
      >
        <ScrollArea.Content className="flex flex-col gap-3">
          <CommentBox
            title={null}
            comments={comments}
            error={commentsQuery.isError}
            emptyText="还没有吐槽。"
            virtual={false}
          />
          {commentsQuery.isFetchingNextPage && (
            <div className="flex flex-col gap-3">
              {Array(3)
                .fill(undefined)
                .map((_, index) => (
                  <CommentSkeleton key={index} />
                ))}
            </div>
          )}
          {commentsQuery.hasNextPage && (
            <Button
              variant="outline"
              disabled={commentsQuery.isFetchingNextPage}
              onClick={() => commentsQuery.fetchNextPage()}
            >
              {commentsQuery.isFetchingNextPage
                ? '加载中'
                : `查看更多${total ? ` ${comments?.length ?? 0}/${total}` : ''}`}
            </Button>
          )}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
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

function toComment(comment: {
  id: number
  user: Comment['user']
  comment: string
  updatedAt: number
}): Comment {
  return {
    id: comment.id,
    mainID: comment.id,
    creatorID: comment.user?.id ?? 0,
    relatedID: 0,
    createdAt: comment.updatedAt,
    content: comment.comment,
    state: 0,
    user: comment.user,
    replies: [],
  }
}
