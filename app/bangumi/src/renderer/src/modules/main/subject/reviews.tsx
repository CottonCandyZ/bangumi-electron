import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectReviewsQuery } from '@renderer/data/hooks/api/subject'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import type { SubjectId } from '@renderer/data/types/bgm'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import {
  OpenMonoListPanelButton,
  useMonoListPanelOpenHandler,
} from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'

const SUBJECT_REVIEWS_PREVIEW_LIMIT = 4

export function SubjectReviews({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const query = useSubjectReviewsQuery({
    enabled: !!subjectId,
    id: subjectId,
    limit: SUBJECT_REVIEWS_PREVIEW_LIMIT,
  })
  const loadedReviews = query.data?.pages.flatMap((page) => page.data) ?? []
  const reviews = loadedReviews.slice(0, SUBJECT_REVIEWS_PREVIEW_LIMIT)
  const total = query.data?.pages[0]?.total ?? loadedReviews.length
  const sourceTitle = subjectInfoQuery.data?.name_cn || subjectInfoQuery.data?.name || ''
  const panelTab = {
    id: `subject-reviews-${subjectId}`,
    panelTitle: '评论文章',
    sourceTitle,
    sourceTo: `/subject/${subjectId}`,
    subjectId,
    title: '评论文章',
    total,
    type: 'subjectReviews',
  } satisfies MonoListPanelTab
  const openInSidePanel = useMonoListPanelOpenHandler(panelTab)

  if (query.isError) return null
  if (query.isLoading) return <ReviewsSkeleton />
  if (reviews.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-2xl font-medium">评论文章</h2>
          <OpenMonoListPanelButton
            className="mt-1 size-8"
            disabled={!sourceTitle}
            tab={panelTab}
            title={sourceTitle ? '在侧栏打开评论文章' : '正在读取条目名称'}
          />
        </div>
        <span className="text-muted-foreground text-sm">{total}</span>
      </div>
      <div className="grid gap-3 @4xl:grid-cols-2">
        {reviews.map(({ entry, user }) => (
          <Card
            className="hover:bg-accent/60 relative flex h-full flex-col gap-2 p-4 shadow-none transition-colors"
            key={entry.id}
          >
            <MyLink
              aria-label={`查看评论：${entry.title}`}
              className="focus-visible:ring-ring absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
              to={`/blog/${entry.id}`}
            />
            <h3 className="pointer-events-none relative line-clamp-2 font-semibold">
              {entry.title}
            </h3>
            {entry.summary && (
              <div className="bbcode text-muted-foreground pointer-events-none relative line-clamp-3 text-sm leading-6 [&_a]:pointer-events-auto [&_a]:relative">
                {renderBBCode(entry.summary)}
              </div>
            )}
            <div className="text-muted-foreground pointer-events-none relative mt-auto flex justify-between gap-3 text-xs">
              <span>{user.nickname || user.username}</span>
              <span>{entry.replies} 回复</span>
            </div>
          </Card>
        ))}
      </div>
      {total > reviews.length && (
        <div className="flex justify-center">
          <Button disabled={!sourceTitle} onClick={openInSidePanel} variant="outline">
            在侧栏查看更多 {reviews.length}/{total}
          </Button>
        </div>
      )}
    </section>
  )
}

function ReviewsSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <Skeleton className="h-7 w-28" />
      <div className="grid gap-3 @4xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
    </section>
  )
}
