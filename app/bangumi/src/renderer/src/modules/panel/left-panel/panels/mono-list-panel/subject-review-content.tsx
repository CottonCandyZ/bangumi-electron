import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useSubjectReviewsQuery } from '@renderer/data/hooks/api/subject'
import type { SubjectReview } from '@renderer/data/types/blog'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { monoListPanelCenterActiveItemAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  isRoutePathActive,
  MonoListPanelFilters,
  PanelItemImage,
  PanelLinkItem,
  useIsRouteActive,
} from './shared'
import { useMonoListPanelRefreshAction } from './use-panel-refresh-action'

const SUBJECT_REVIEWS_PANEL_LIMIT = 10

export function SubjectReviewsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectReviews' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const query = useSubjectReviewsQuery({
    id: tab.subjectId,
    limit: SUBJECT_REVIEWS_PANEL_LIMIT,
  })
  useMonoListPanelRefreshAction({
    onRefresh: () => query.refetch(),
    refreshing: query.isFetching && !query.isFetchingNextPage,
    tabId: tab.id,
  })
  const reviews = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data])
  const total = query.data?.pages[0]?.total
  const activeIndex = useMemo(
    () => reviews.findIndex((review) => isRoutePathActive(pathname, `/blog/${review.entry.id}`)),
    [pathname, reviews],
  )

  if (query.isLoading && reviews.length === 0) {
    return (
      <>
        <SubjectReviewsPanelStatus label="正在加载评论文章" loading />
        <SubjectReviewsPanelSkeleton />
      </>
    )
  }
  if (query.isError && reviews.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-start gap-3 p-4 text-sm">
        <span>暂时无法读取评论文章。</span>
        <Button
          disabled={query.isFetching}
          onClick={() => query.refetch()}
          size="sm"
          variant="outline"
        >
          {query.isFetching ? '重试中' : '重试'}
        </Button>
      </div>
    )
  }

  return (
    <>
      <SubjectReviewsPanelStatus
        label={`已加载 ${reviews.length.toLocaleString()}${
          total !== undefined ? ` / ${total.toLocaleString()}` : ''
        } 篇评论文章`}
        loading={query.isFetching && !query.isFetchingNextPage}
      />
      <SingleColumnVirtualList
        activeIndex={centerActiveItem ? activeIndex : undefined}
        appendPlaceholderCount={SUBJECT_REVIEWS_PANEL_LIMIT}
        className="px-2 py-2"
        empty={<div className="text-muted-foreground p-4 text-sm">没有评论文章。</div>}
        estimateSize={108}
        footer={
          query.isFetchNextPageError ? (
            <SubjectReviewsFetchMoreError
              disabled={query.isFetchingNextPage}
              onRetry={() => query.fetchNextPage()}
            />
          ) : undefined
        }
        gap={4}
        getKey={(review) => review.id}
        hasMore={!query.isFetchNextPageError && !!query.hasNextPage}
        isFetchingMore={query.isFetchingNextPage}
        items={reviews}
        onNearBottom={() => query.fetchNextPage()}
        renderItem={(review) => <SubjectReviewPanelItem review={review} />}
        renderPlaceholder={() => <SubjectReviewPanelSkeletonItem />}
        rootClassName="flex-1"
        scrollMemoryKey={`mono-list:${tab.id}`}
        showBackToTop
      />
    </>
  )
}

function SubjectReviewsPanelStatus({
  label,
  loading = false,
}: {
  label: string
  loading?: boolean
}) {
  return (
    <MonoListPanelFilters>
      <div className="text-muted-foreground flex w-full items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        {loading && <span>刷新中</span>}
      </div>
    </MonoListPanelFilters>
  )
}

function SubjectReviewsFetchMoreError({
  disabled,
  onRetry,
}: {
  disabled: boolean
  onRetry: () => Promise<unknown> | unknown
}) {
  return (
    <div className="text-muted-foreground flex min-h-14 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm">
      <span>加载更多评论文章失败</span>
      <Button
        className="h-8 shrink-0 px-2 text-xs"
        disabled={disabled}
        onClick={() => {
          void onRetry()
        }}
        size="sm"
        variant="outline"
      >
        {disabled ? '重试中' : '重试'}
      </Button>
    </div>
  )
}

function SubjectReviewPanelItem({ review }: { review: SubjectReview }) {
  const to = `/blog/${review.entry.id}`
  const active = useIsRouteActive(to)

  return (
    <PanelLinkItem active={active} to={to}>
      <PanelItemImage image={review.entry.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-2 text-sm font-medium">{review.entry.title}</div>
        <div className="text-muted-foreground line-clamp-1 text-xs">
          {review.user.nickname || review.user.username}
        </div>
        <div className="mt-auto flex flex-wrap gap-1">
          <Badge className="text-xs shadow-none" variant="outline">
            {review.entry.replies} 回复
          </Badge>
          <Badge className="text-xs shadow-none" variant="secondary">
            {formatRecentUnixTime(review.entry.updatedAt)}
          </Badge>
        </div>
      </div>
    </PanelLinkItem>
  )
}

function SubjectReviewsPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }, (_, index) => (
        <SubjectReviewPanelSkeletonItem key={index} />
      ))}
    </div>
  )
}

function SubjectReviewPanelSkeletonItem() {
  return (
    <div className="flex min-h-24 gap-3 rounded-md p-2">
      <Skeleton className="size-16 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
