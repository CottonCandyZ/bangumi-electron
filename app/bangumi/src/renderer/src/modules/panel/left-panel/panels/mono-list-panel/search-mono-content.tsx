import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useInfinityQuerySearch } from '@renderer/data/hooks/api/search'
import type { SearchMonoData } from '@renderer/data/types/search'
import { cn } from '@renderer/lib/utils'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { isRoutePathActive, MonoListPanelFilters, useActivePanelItemRef } from './shared'

export function SearchMonosListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'searchMonos' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const monoType = tab.searchParam.category === 'persons' ? 'person' : 'character'
  const searchQuery = useInfinityQuerySearch({
    searchParam: tab.searchParam,
    limit: 30,
  })
  const items = useMemo(
    () => (searchQuery.data?.pages.flatMap((page) => page.data) ?? []) as SearchMonoData[],
    [searchQuery.data],
  )
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, `/${monoType}/${item.id}`)),
    [items, monoType, pathname],
  )

  if (searchQuery.isLoading && items.length === 0) {
    return (
      <>
        <SearchMonoPanelSummary />
        <SearchMonoPanelSkeleton />
      </>
    )
  }

  return (
    <>
      <SearchMonoPanelSummary loaded={items.length} total={searchQuery.data?.pages[0]?.total} />
      <SingleColumnVirtualList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => <SearchMonoPanelItem item={item} monoType={monoType} />}
        activeIndex={centerActiveItem ? activeIndex : undefined}
        empty={<div className="text-muted-foreground p-4 text-sm">没有符合条件的结果。</div>}
        estimateSize={92}
        gap={4}
        hasMore={!searchQuery.isError && !!searchQuery.hasNextPage}
        isFetchingMore={searchQuery.isFetchingNextPage}
        onNearBottom={() => searchQuery.fetchNextPage()}
        renderPlaceholder={(index) => <Skeleton key={index} className="h-24 w-full rounded-md" />}
        rootClassName="flex-1"
        className="px-2 py-2"
        scrollMemoryKey={`mono-list:${tab.id}`}
        showBackToTop
      />
    </>
  )
}

function SearchMonoPanelSummary({ loaded, total }: { loaded?: number; total?: number }) {
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
    </MonoListPanelFilters>
  )
}

function SearchMonoPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-md" />
      ))}
    </div>
  )
}

function SearchMonoPanelItem({
  item,
  monoType,
}: {
  item: SearchMonoData
  monoType: 'person' | 'character'
}) {
  const to = `/${monoType}/${item.id}`
  const active = isRoutePathActive(useLocation().pathname, to)
  const ref = useActivePanelItemRef(active)
  const image = item.image || item.images?.medium || item.images?.grid
  const summary = item.summary || item.short_summary

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
            imageClassName="h-full w-full object-cover object-top"
            loadingClassName="h-20 w-14"
            careLoading
          />
        ) : (
          <div className="bg-muted h-20 w-14 shrink-0 rounded-md" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="line-clamp-1 text-sm font-medium">{item.name}</div>
          <div className="text-muted-foreground line-clamp-1 text-xs">
            {monoType === 'person' ? '人物' : '角色'}
          </div>
          <div className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
            {summary || '--'}
          </div>
        </div>
      </MyLink>
    </div>
  )
}
