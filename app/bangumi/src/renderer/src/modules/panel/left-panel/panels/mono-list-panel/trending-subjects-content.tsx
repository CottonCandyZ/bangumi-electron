import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { useTrendsInfiniteQuery } from '@renderer/data/hooks/web/subject'
import { cn } from '@renderer/lib/utils'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { isRoutePathActive, MonoListPanelFilters, useActivePanelItemRef } from './shared'
import { useMonoListPanelRefreshAction } from './use-panel-refresh-action'

const ESTIMATED_SUBJECT_HEIGHT = 96
const TRENDING_SUBJECT_INFO_STALE_TIME = 1000 * 60 * 60 * 24

export function TrendingSubjectsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'trendingSubjects' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const trendsQuery = useTrendsInfiniteQuery(tab.sectionPath)
  useMonoListPanelRefreshAction({
    onRefresh: () => trendsQuery.refetch(),
    refreshing: trendsQuery.isFetching && !trendsQuery.isFetchingNextPage,
    tabId: tab.id,
  })
  const subjectIds = useMemo(() => {
    const seen = new Set<string>()
    return (
      trendsQuery.data?.pages.flatMap((page) =>
        page.flatMap((item) => {
          if (!item.SubjectId || seen.has(item.SubjectId)) return []
          seen.add(item.SubjectId)
          return [item.SubjectId]
        }),
      ) ?? []
    )
  }, [trendsQuery.data])
  const activeIndex = useMemo(
    () => subjectIds.findIndex((id) => isRoutePathActive(pathname, `/subject/${id}`)),
    [pathname, subjectIds],
  )

  if (trendsQuery.isLoading && subjectIds.length === 0) {
    return (
      <>
        <TrendingSubjectsPanelStatus label="加载近期热门" />
        <TrendingSubjectsPanelSkeleton />
      </>
    )
  }

  if (trendsQuery.isError && subjectIds.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">暂时无法读取近期热门。</div>
  }

  return (
    <>
      <TrendingSubjectsPanelStatus
        label={`已加载 ${subjectIds.length.toLocaleString()} 个近期热门`}
        loading={trendsQuery.isFetching}
      />
      <SingleColumnVirtualList
        items={subjectIds}
        getKey={(id) => id}
        renderItem={(id) => <TrendingSubjectPanelItem id={id} />}
        activeIndex={centerActiveItem ? activeIndex : undefined}
        empty={<div className="text-muted-foreground p-4 text-sm">没有近期热门条目。</div>}
        estimateSize={ESTIMATED_SUBJECT_HEIGHT}
        gap={4}
        footer={
          trendsQuery.isFetchNextPageError ? (
            <TrendingSubjectsFetchMoreError
              disabled={trendsQuery.isFetchingNextPage}
              onRetry={() => trendsQuery.fetchNextPage()}
            />
          ) : undefined
        }
        hasMore={!trendsQuery.isFetchNextPageError && !!trendsQuery.hasNextPage}
        isFetchingMore={trendsQuery.isFetchingNextPage}
        onNearBottom={() => trendsQuery.fetchNextPage()}
        renderPlaceholder={() => <TrendingSubjectPanelItemSkeleton />}
        rootClassName="flex-1"
        className="px-2 py-2"
        scrollMemoryKey={`mono-list:${tab.id}`}
        showBackToTop
      />
    </>
  )
}

function TrendingSubjectsPanelStatus({
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

function TrendingSubjectsFetchMoreError({
  disabled,
  onRetry,
}: {
  disabled: boolean
  onRetry: () => Promise<unknown> | unknown
}) {
  return (
    <div className="text-muted-foreground flex min-h-14 flex-row items-center justify-between gap-3 rounded-md px-3 py-2 text-sm">
      <span>加载更多近期热门失败</span>
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

function TrendingSubjectsPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <TrendingSubjectPanelItemSkeleton key={index} />
      ))}
    </div>
  )
}

function TrendingSubjectPanelItem({ id }: { id: string }) {
  const to = `/subject/${id}`
  const active = isRoutePathActive(useLocation().pathname, to)
  const ref = useActivePanelItemRef(active)
  const subjectQuery = useSubjectInfoQuery({
    subjectId: id,
    dbStaleTime: TRENDING_SUBJECT_INFO_STALE_TIME,
  })
  const subject = subjectQuery.data ?? null

  if (!subject) {
    return <TrendingSubjectPanelItemSkeleton innerRef={ref} />
  }

  const title = subject.name_cn || subject.name
  const subtitle = subject.name_cn ? subject.name : undefined
  const score = subject.rating.score
  const rank = subject.rating.rank
  const detailText = [
    SUBJECT_TYPE_MAP[subject.type],
    subject.date ? dayjs(subject.date).format('YYYY-MM-DD') : undefined,
    subject.platform,
  ]
    .filter(Boolean)
    .join(' / ')

  return (
    <div ref={ref}>
      <MyLink
        className={cn(
          'hover:bg-accent data-[active=true]:bg-accent flex min-h-24 cursor-default flex-row gap-3 rounded-md p-2',
        )}
        data-active={active}
        to={to}
        onClick={(event) => {
          if (active) event.preventDefault()
        }}
      >
        {subject.images?.grid || subject.images?.common ? (
          <Image
            imageSrc={subject.images.grid || subject.images.common}
            className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md"
            imageClassName="h-full w-full object-cover"
            loadingClassName="h-20 w-14"
            careLoading
          />
        ) : (
          <div className="bg-muted h-20 w-14 shrink-0 rounded-md" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="line-clamp-1 text-sm font-medium">{title}</div>
          {subtitle && <div className="text-muted-foreground line-clamp-1 text-xs">{subtitle}</div>}
          <div className="text-muted-foreground line-clamp-1 text-xs">
            {detailText || subject.summary || '--'}
          </div>
          <div className="mt-auto flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className="font-semibold tabular-nums"
              style={{ color: `hsl(var(--chart-score-${Math.floor(score + 0.5) || 1}))` }}
            >
              {score > 0 ? score.toFixed(1) : '--'}
            </span>
            {rank > 0 && (
              <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[11px] tabular-nums">
                # {rank}
              </Badge>
            )}
            <span className="text-muted-foreground">
              {subject.rating.total > 0 ? subject.rating.total.toLocaleString() : '--'} 人参与
            </span>
          </div>
        </div>
      </MyLink>
    </div>
  )
}

function TrendingSubjectPanelItemSkeleton({ innerRef }: { innerRef?: Ref<HTMLDivElement> }) {
  return (
    <div className="flex min-h-24 flex-row gap-3 rounded-md p-2" ref={innerRef}>
      <Skeleton className="h-20 w-14 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
