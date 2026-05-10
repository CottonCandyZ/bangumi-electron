import { ScrollArea } from '@base-ui/react/scroll-area'
import { CommentBox } from '@renderer/components/comment/comment-box'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectCommentsQuery } from '@renderer/data/hooks/api/subject'
import { toCommentFromSubjectInterest } from '@renderer/data/transformer/comment'
import { SubjectId } from '@renderer/data/types/bgm'
import { useCallback, useMemo } from 'react'

const SUBJECT_COMMENTS_PAGE_LIMIT = 20

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
    limit: SUBJECT_COMMENTS_PAGE_LIMIT,
  })
  const commentList = useMemo(
    () =>
      commentsQuery.data?.pages.flatMap((page, pageIndex) =>
        page.data.map((comment) => ({
          comment: toCommentFromSubjectInterest(comment),
          groupKey: pageIndex,
        })),
      ),
    [commentsQuery.data],
  )
  const comments = useMemo(() => commentList?.map((item) => item.comment), [commentList])
  const total = commentsQuery.data?.pages[0]?.total
  const floorNumbers = useMemo(
    () => (comments && total !== undefined ? comments.map((_, index) => total - index) : undefined),
    [comments, total],
  )
  const virtualGroupKeys = useMemo(() => commentList?.map((item) => item.groupKey), [commentList])
  const loadMore = useCallback(() => {
    if (commentsQuery.isError || !commentsQuery.hasNextPage || commentsQuery.isFetchingNextPage) {
      return undefined
    }

    return commentsQuery.fetchNextPage()
  }, [commentsQuery])

  if (!enabled) return null

  if (comments === undefined && !commentsQuery.isError) {
    return (
      <ScrollArea.Root className="group/scroll relative h-full w-full overflow-hidden">
        <ScrollArea.Viewport className="h-full w-full overflow-x-hidden px-3 py-3 focus-visible:outline-hidden">
          <ScrollArea.Content className="flex min-h-full w-full flex-col gap-3">
            {Array(8)
              .fill(undefined)
              .map((_, index) => (
                <CommentSkeleton key={index} />
              ))}
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

  return (
    <div className="h-full min-h-0">
      <CommentBox
        title={null}
        className="h-full min-h-0"
        contentClassName="min-h-0 flex-1"
        listClassName="h-full max-h-none px-3 py-3"
        comments={comments}
        error={commentsQuery.isError}
        emptyText="还没有吐槽。"
        floorNumbers={floorNumbers}
        virtual
        showBackToTop
        hasMore={!!commentsQuery.hasNextPage}
        isFetchingMore={commentsQuery.isFetchingNextPage}
        appendPlaceholderCount={SUBJECT_COMMENTS_PAGE_LIMIT}
        virtualGroupKeys={virtualGroupKeys}
        onListNearBottom={loadMore}
      />
    </div>
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
