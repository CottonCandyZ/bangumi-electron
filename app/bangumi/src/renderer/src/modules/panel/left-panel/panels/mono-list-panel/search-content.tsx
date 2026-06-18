import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useInfinityQuerySearch } from '@renderer/data/hooks/api/search'
import type { SearchParam, SearchSubjectData } from '@renderer/data/types/search'
import { cn } from '@renderer/lib/utils'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { SortButton } from '@renderer/modules/main/search/sort/sort-buttons'
import {
  getSearchSubjectImage,
  getSearchSubjectSubtitle,
  getSearchSubjectTitle,
} from '@renderer/modules/main/search/utils'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isRoutePathActive, MonoListPanelFilters, useActivePanelItemRef } from './shared'

export function SearchSubjectsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'searchSubjects' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const [sort, setSort] = useState<SearchParam['sort']>(tab.searchParam.sort ?? 'heat')

  useEffect(() => {
    setSort(tab.searchParam.sort ?? 'heat')
  }, [tab.id, tab.searchParam.sort])

  const searchParam = useMemo(
    () => ({
      ...tab.searchParam,
      sort,
    }),
    [sort, tab.searchParam],
  )
  const searchQuery = useInfinityQuerySearch({
    searchParam,
    limit: 30,
  })
  const items = useMemo(
    () => (searchQuery.data?.pages.flatMap((page) => page.data) ?? []) as SearchSubjectData[],
    [searchQuery.data],
  )
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, `/subject/${item.id}`)),
    [items, pathname],
  )

  if (searchQuery.isLoading && items.length === 0) {
    return (
      <>
        <SearchPanelSort value={sort} onValueChanged={setSort} />
        <SearchPanelSkeleton />
      </>
    )
  }

  return (
    <>
      <SearchPanelSort
        value={sort}
        onValueChanged={setSort}
        loaded={items.length}
        total={searchQuery.data?.pages[0]?.total}
      />
      <SingleColumnVirtualList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => <SearchPanelItem item={item} />}
        activeIndex={centerActiveItem ? activeIndex : undefined}
        empty={<div className="text-muted-foreground p-4 text-sm">没有符合条件的条目。</div>}
        estimateSize={92}
        gap={4}
        hasMore={searchQuery.hasNextPage}
        isFetchingMore={searchQuery.isFetchingNextPage}
        onNearBottom={() => searchQuery.fetchNextPage()}
        renderPlaceholder={(index) => <Skeleton key={index} className="h-24 w-full rounded-md" />}
        rootClassName="flex-1"
        className="px-2 py-2"
        scrollMemoryKey={`${tab.id}-${sort}`}
        showBackToTop
      />
    </>
  )
}

function SearchPanelSort({
  value,
  onValueChanged,
  loaded,
  total,
}: {
  value: SearchParam['sort']
  onValueChanged: (value: SearchParam['sort']) => void
  loaded?: number
  total?: number
}) {
  return (
    <MonoListPanelFilters>
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {total === undefined
            ? '搜索中'
            : total > 0
              ? `${total.toLocaleString()} 个结果`
              : '没有结果'}
        </span>
        {total !== undefined && loaded !== undefined && loaded < total && (
          <span className="text-muted-foreground text-xs">已加载 {loaded.toLocaleString()}</span>
        )}
      </div>
      <SortButton value={value} onValueChanged={onValueChanged} size="sm" shape="square" />
    </MonoListPanelFilters>
  )
}

function SearchPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-md" />
      ))}
    </div>
  )
}

function SearchPanelItem({ item }: { item: SearchSubjectData }) {
  const to = `/subject/${item.id}`
  const active = isRoutePathActive(useLocation().pathname, to)
  const ref = useActivePanelItemRef(active)
  const image = getSearchSubjectImage(item)
  const title = getSearchSubjectTitle(item)
  const subtitle = getSearchSubjectSubtitle(item)
  const score = item.rating.score
  const rank = item.rating.rank
  const detailText = [SUBJECT_TYPE_MAP[item.type], item.date, item.platform]
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
        {image ? (
          <Image
            imageSrc={image}
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
            {detailText || item.summary || '--'}
          </div>
          <div className="mt-auto flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="text-muted-foreground inline-flex items-baseline gap-1">
              <span
                className="font-semibold tabular-nums"
                style={{ color: `hsl(var(--chart-score-${Math.floor(score + 0.5) || 1}))` }}
              >
                {score > 0 ? score.toFixed(1) : '--'}
              </span>
            </span>
            {rank > 0 && (
              <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[11px] tabular-nums">
                # {rank}
              </Badge>
            )}
            <span className="text-muted-foreground">
              {item.rating.total > 0 ? item.rating.total.toLocaleString() : '--'} 人参与
            </span>
          </div>
        </div>
      </MyLink>
    </div>
  )
}
