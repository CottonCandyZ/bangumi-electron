import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useSubjectsInfoQuery } from '@renderer/data/hooks/db/subject'
import { useTrendsInfiniteQuery } from '@renderer/data/hooks/web/subject'
import type { Subject } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { isRoutePathActive, MonoListPanelFilters, useActivePanelItemRef } from './shared'

const ESTIMATED_SUBJECT_HEIGHT = 96

export function TrendingSubjectsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'trendingSubjects' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const trendsQuery = useTrendsInfiniteQuery(tab.sectionPath)
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
  const subjectsQuery = useSubjectsInfoQuery({
    subjectIds,
    enabled: subjectIds.length > 0,
  })
  const items = useMemo(
    () =>
      subjectIds.map((id, index) => ({
        id,
        subject: subjectsQuery.data?.[index] ?? null,
      })),
    [subjectIds, subjectsQuery.data],
  )
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, `/subject/${item.id}`)),
    [items, pathname],
  )

  if (trendsQuery.isLoading && items.length === 0) {
    return (
      <>
        <TrendingSubjectsPanelStatus label="加载近期热门" />
        <TrendingSubjectsPanelSkeleton />
      </>
    )
  }

  if (trendsQuery.isError) {
    return <div className="text-muted-foreground p-4 text-sm">暂时无法读取近期热门。</div>
  }

  return (
    <>
      <TrendingSubjectsPanelStatus
        label={`已加载 ${items.length.toLocaleString()} 个近期热门`}
        loading={trendsQuery.isFetching}
      />
      <SingleColumnVirtualList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => <TrendingSubjectPanelItem id={item.id} subject={item.subject} />}
        activeIndex={centerActiveItem ? activeIndex : undefined}
        empty={<div className="text-muted-foreground p-4 text-sm">没有近期热门条目。</div>}
        estimateSize={ESTIMATED_SUBJECT_HEIGHT}
        gap={4}
        hasMore={!!trendsQuery.hasNextPage}
        isFetchingMore={trendsQuery.isFetchingNextPage}
        onNearBottom={() => trendsQuery.fetchNextPage()}
        renderPlaceholder={() => <TrendingSubjectPanelItemSkeleton />}
        rootClassName="flex-1"
        className="px-2 py-2"
        scrollAreaKey={`mono-list:${tab.id}`}
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

function TrendingSubjectsPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <TrendingSubjectPanelItemSkeleton key={index} />
      ))}
    </div>
  )
}

function TrendingSubjectPanelItem({ id, subject }: { id: string; subject: Subject | null }) {
  const to = `/subject/${id}`
  const active = isRoutePathActive(useLocation().pathname, to)
  const ref = useActivePanelItemRef(active)

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
