import { CommentBox, CommentSkeleton } from '@renderer/components/comment/comment-box'
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
  const loadMore = useCallback(() => {
    if (commentsQuery.isError || !commentsQuery.hasNextPage || commentsQuery.isFetchingNextPage) {
      return undefined
    }

    return commentsQuery.fetchNextPage()
  }, [commentsQuery])

  if (!enabled) return null

  if (comments === undefined && !commentsQuery.isError) {
    return (
      <div className="relative h-full w-full overflow-hidden" key={`subject-comments-${subjectId}`}>
        <div className="h-full w-full overflow-x-hidden overflow-y-auto px-3 py-3 focus-visible:outline-hidden">
          <div className="flex min-h-full w-full flex-col gap-3">
            {Array(8)
              .fill(undefined)
              .map((_, index) => (
                <CommentSkeleton key={index} />
              ))}
          </div>
        </div>
      </div>
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
        reactionTarget={{ id: subjectId, type: 'subject-collect' }}
        scrollMemoryKey={`subject-comments-${subjectId}`}
        virtual
        showBackToTop
        userAvatarViewTransition={false}
        hasMore={!!commentsQuery.hasNextPage}
        isFetchingMore={commentsQuery.isFetchingNextPage}
        appendPlaceholderCount={SUBJECT_COMMENTS_PAGE_LIMIT}
        onListNearBottom={loadMore}
      />
    </div>
  )
}
