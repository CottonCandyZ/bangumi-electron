import { CommentBox } from '@renderer/components/comment/comment-box'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectCommentsQuery } from '@renderer/data/hooks/api/subject'
import { toCommentFromSubjectInterest } from '@renderer/data/transformer/comment'
import { SubjectId } from '@renderer/data/types/bgm'
import { useCallback, useMemo } from 'react'

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
  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data.map(toCommentFromSubjectInterest)),
    [commentsQuery.data],
  )
  const total = commentsQuery.data?.pages.at(-1)?.total
  const loadMore = useCallback(() => {
    if (commentsQuery.isError || !commentsQuery.hasNextPage || commentsQuery.isFetchingNextPage) {
      return
    }

    commentsQuery.fetchNextPage()
  }, [commentsQuery])

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
    <div className="h-full min-h-0 p-3">
      <CommentBox
        title={null}
        className="h-full min-h-0"
        contentClassName="min-h-0 flex-1"
        listClassName="h-full max-h-none"
        comments={comments}
        error={commentsQuery.isError}
        emptyText="还没有吐槽。"
        virtual
        onListNearBottom={loadMore}
        footer={
          commentsQuery.hasNextPage ? (
            <Button
              variant="outline"
              disabled={commentsQuery.isFetchingNextPage}
              onClick={() => commentsQuery.fetchNextPage()}
            >
              {commentsQuery.isFetchingNextPage
                ? '加载中'
                : `查看更多${total ? ` ${comments?.length ?? 0}/${total}` : ''}`}
            </Button>
          ) : null
        }
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
