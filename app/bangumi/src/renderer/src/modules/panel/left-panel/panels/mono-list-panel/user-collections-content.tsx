import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo } from 'react'
import {
  isRoutePathActive,
  PanelItemImage,
  PanelLinkItem,
  SUBJECT_TYPE_MAP,
  useIsRouteActive,
} from './shared'
import { useLocation } from 'react-router-dom'

const COLLECTION_PANEL_LIMIT = 20

export function UserCollectionsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'userCollections' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const collectionsQuery = useInfinityQueryCollectionsByUsername({
    username: tab.username,
    subjectType: tab.subjectType,
    collectionType: tab.collectionType,
    limit: COLLECTION_PANEL_LIMIT,
    initialPageParam: 0,
    enabled: !!tab.username,
    needKeepPreviousData: false,
  })
  const collections = collectionsQuery.data
  const items = useMemo(
    () =>
      collections
        ? collections.pages.flatMap((page, index) =>
            page.data.map((item) => ({
              data: item,
              index,
            })),
          )
        : [],
    [collections],
  )
  const activeIndex = useMemo(
    () =>
      items.findIndex((item) => isRoutePathActive(pathname, `/subject/${item.data.subject_id}`)),
    [items, pathname],
  )
  useEffect(() => {
    if (new Set(items.map((item) => item.data.subject_id)).size !== items.length) {
      collectionsQuery.refetch()
    }
  }, [collectionsQuery, items])

  if (!collections) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <UserCollectionListItemSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">没有符合条件的项目。</div>
  }

  return (
    <SingleColumnVirtualList
      items={items}
      getKey={(item) => item.data.subject_id}
      renderItem={(item) => <UserCollectionListItem item={item.data} />}
      activeIndex={centerActiveItem ? activeIndex : undefined}
      rootClassName="flex-1"
      className="px-2 py-2"
      estimateSize={84}
      gap={4}
      hasMore={!collectionsQuery.isError && !!collectionsQuery.hasNextPage}
      isFetchingMore={collectionsQuery.isFetchingNextPage}
      appendPlaceholderCount={COLLECTION_PANEL_LIMIT}
      renderPlaceholder={() => <UserCollectionListItemSkeleton />}
      onNearBottom={() => collectionsQuery.fetchNextPage()}
      scrollAreaKey={`mono-list:${tab.id}`}
    />
  )
}

function UserCollectionListItemSkeleton() {
  return (
    <div className="flex min-h-20 w-full flex-row gap-3 rounded-md p-2">
      <Skeleton className="size-14 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <div className="mt-auto flex flex-row gap-1">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function UserCollectionListItem({ item }: { item: CollectionData }) {
  const to = `/subject/${item.subject_id}`
  const active = useIsRouteActive(to)

  return (
    <PanelLinkItem active={active} to={to}>
      <PanelItemImage image={item.subject.images.grid || item.subject.images.common} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">
          {item.subject.name_cn || item.subject.name}
        </div>
        {item.subject.name_cn && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{item.subject.name}</div>
        )}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {SUBJECT_TYPE_MAP[item.subject.type]}
          </Badge>
          {item.rate > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs shadow-none">
              {item.rate}
              <span className="i-mingcute-star-fill text-[0.65rem]" />
            </Badge>
          )}
        </div>
      </div>
    </PanelLinkItem>
  )
}
