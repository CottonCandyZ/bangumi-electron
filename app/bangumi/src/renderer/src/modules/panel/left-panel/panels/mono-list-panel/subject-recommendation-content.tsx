import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useSubjectRecommendationsQuery } from '@renderer/data/hooks/api/subject'
import type { SubjectRecommendation } from '@renderer/data/types/subject'
import {
  formatCompactSubjectCount,
  formatRecommendationSimilarity,
  getRecommendationSubjectImage,
  getRecommendationSubjectSubtitle,
  getRecommendationSubjectTitle,
} from '@renderer/modules/common/subject-recommendation-meta'
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

const SUBJECT_RECOMMENDATIONS_PANEL_LIMIT = 10

export function SubjectRecommendationsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectRecommendations' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const recommendationsQuery = useSubjectRecommendationsQuery({
    id: tab.subjectId,
    limit: SUBJECT_RECOMMENDATIONS_PANEL_LIMIT,
  })
  useMonoListPanelRefreshAction({
    onRefresh: () => recommendationsQuery.refetch(),
    refreshing: recommendationsQuery.isFetching && !recommendationsQuery.isFetchingNextPage,
    tabId: tab.id,
  })
  const items = useMemo(
    () => recommendationsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [recommendationsQuery.data],
  )
  const total = recommendationsQuery.data?.pages[0]?.total
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, `/subject/${item.subject.id}`)),
    [items, pathname],
  )

  if (recommendationsQuery.isLoading && items.length === 0) {
    return <SubjectRecommendationsPanelSkeleton />
  }

  if (recommendationsQuery.isError && items.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">暂时无法读取推荐条目。</div>
  }

  return (
    <>
      <MonoListPanelFilters>
        <div className="text-muted-foreground flex w-full items-center justify-between gap-2 text-xs">
          <span>
            已加载 {items.length.toLocaleString()}
            {total ? ` / ${total.toLocaleString()}` : ''} 个推荐条目
          </span>
          {recommendationsQuery.isFetching && <span>刷新中</span>}
        </div>
      </MonoListPanelFilters>
      <SingleColumnVirtualList
        activeIndex={centerActiveItem ? activeIndex : undefined}
        appendPlaceholderCount={SUBJECT_RECOMMENDATIONS_PANEL_LIMIT}
        className="px-2 py-2"
        empty={<div className="text-muted-foreground p-4 text-sm">没有推荐条目。</div>}
        estimateSize={92}
        gap={4}
        getKey={(item) => item.subject.id}
        hasMore={!recommendationsQuery.isFetchNextPageError && !!recommendationsQuery.hasNextPage}
        isFetchingMore={recommendationsQuery.isFetchingNextPage}
        items={items}
        onNearBottom={() => recommendationsQuery.fetchNextPage()}
        renderItem={(item) => <SubjectRecommendationPanelItem item={item} />}
        renderPlaceholder={() => <SubjectRecommendationPanelSkeletonItem />}
        rootClassName="flex-1"
        scrollMemoryKey={`mono-list:${tab.id}`}
        showBackToTop
      />
    </>
  )
}

function SubjectRecommendationPanelItem({ item }: { item: SubjectRecommendation }) {
  const to = `/subject/${item.subject.id}`
  const active = useIsRouteActive(to)
  const title = getRecommendationSubjectTitle(item)
  const subtitle = getRecommendationSubjectSubtitle(item)
  const score = item.subject.rating?.score
  const ratingTotal = item.subject.rating?.total

  return (
    <PanelLinkItem active={active} to={to}>
      <PanelItemImage image={getRecommendationSubjectImage(item)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">{title}</div>
        {subtitle && <div className="text-muted-foreground line-clamp-1 text-xs">{subtitle}</div>}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          {score !== undefined && score > 0 ? (
            <Badge variant="secondary" className="text-xs shadow-none">
              {score.toFixed(1)}
            </Badge>
          ) : null}
          {ratingTotal !== undefined && ratingTotal > 0 ? (
            <Badge variant="outline" className="text-xs shadow-none">
              {formatCompactSubjectCount(ratingTotal)} 评分
            </Badge>
          ) : null}
          <Badge variant="outline" className="text-xs shadow-none">
            相似 {formatRecommendationSimilarity(item.sim)}
          </Badge>
          {item.count > 0 ? (
            <Badge variant="secondary" className="text-xs shadow-none">
              共现 {item.count}
            </Badge>
          ) : null}
        </div>
      </div>
    </PanelLinkItem>
  )
}

function SubjectRecommendationsPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <SubjectRecommendationPanelSkeletonItem key={index} />
      ))}
    </div>
  )
}

function SubjectRecommendationPanelSkeletonItem() {
  return (
    <div className="flex min-h-20 flex-row gap-3 rounded-md p-2">
      <Skeleton className="size-16 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
