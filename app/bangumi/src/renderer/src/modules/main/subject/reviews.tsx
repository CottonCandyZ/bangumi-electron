import { MyLink } from '@renderer/components/my-link'
import { AuthorLabel } from '@renderer/components/author-label'
import { Button } from '@renderer/components/ui/button'
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
    <section className="@container flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-base font-semibold">评论文章</h2>
          <span className="text-muted-foreground text-xs tabular-nums">{total}</span>
          <OpenMonoListPanelButton
            className="size-6"
            disabled={!sourceTitle}
            tab={panelTab}
            title={sourceTitle ? '在侧栏打开评论文章' : '正在读取条目名称'}
          />
        </div>
        {total > reviews.length && (
          <Button size="sm" disabled={!sourceTitle} onClick={openInSidePanel} variant="ghost">
            查看全部
          </Button>
        )}
      </div>
      <ul className="divide-y border-y">
        {reviews.map(({ entry, user }) => (
          <li
            className="hover:bg-accent/40 relative grid min-w-0 cursor-default grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-2 py-2.5 transition-colors @xl:grid-cols-[minmax(0,1fr)_7rem_4rem]"
            key={entry.id}
          >
            <MyLink
              aria-label={`查看评论：${entry.title}`}
              className="focus-visible:ring-ring absolute inset-0 z-10 cursor-default rounded-sm focus-visible:ring-2 focus-visible:outline-none"
              to={`/blog/${entry.id}`}
            />
            <div className="min-w-0">
              <h3 title={entry.title} className="truncate text-sm font-medium">
                {entry.title}
              </h3>
              {entry.summary && (
                <div
                  inert
                  className="bbcode text-muted-foreground mt-1 line-clamp-1 text-xs [&_p]:inline"
                >
                  {renderBBCode(entry.summary)}
                </div>
              )}
            </div>
            <span
              className="text-muted-foreground col-start-1 row-start-2 truncate text-xs @xl:col-start-2 @xl:row-start-1"
              title={user.nickname || user.username}
            >
              <AuthorLabel name={user.nickname || user.username} avatar={user.avatar?.small} />
            </span>
            <span className="text-muted-foreground col-start-2 row-start-1 text-right text-xs whitespace-nowrap tabular-nums @xl:col-start-3">
              {entry.replies} 回复
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ReviewsSkeleton() {
  return (
    <section className="flex flex-col gap-2" aria-label="正在加载评论文章" aria-busy="true">
      <Skeleton className="h-8 w-28" />
      <div className="divide-y border-y">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="flex items-start justify-between gap-4 px-2 py-2.5" key={index}>
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </section>
  )
}
