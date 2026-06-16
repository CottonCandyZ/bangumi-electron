import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useInfinityQueryP1Collections } from '@renderer/data/hooks/api/collection'
import type { P1CollectionItemMap, P1CollectionResourceType } from '@renderer/data/types/collection'
import type { P1SlimMono, SlimIndex } from '@renderer/data/types/index'
import { cn } from '@renderer/lib/utils'
import { getIndexDisplayTitle } from '@renderer/modules/common/index-title'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { useSetAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const P1_COLLECTION_PANEL_LIMIT = 20
type P1PanelResourceType = Exclude<P1CollectionResourceType, 'subject'>
type P1PanelCollectionItem = P1CollectionItemMap[P1PanelResourceType]

export function P1CollectionList({
  resourceType,
  username,
}: {
  resourceType: P1PanelResourceType
  username: string | undefined
}) {
  const query = useInfinityQueryP1Collections({
    username,
    resourceType,
    limit: P1_COLLECTION_PANEL_LIMIT,
    enabled: true,
    needKeepPreviousData: false,
    refetchPageLimit: 0,
  })
  const setIsRefetching = useSetAtom(collectionPanelIsRefetchingAtom)
  const items = useMemo(
    () =>
      query.data
        ? query.data.pages.flatMap((page) =>
            (page.data as P1PanelCollectionItem[]).map((item) => ({
              item,
              resourceType,
            })),
          )
        : [],
    [query.data, resourceType],
  )

  useEffect(() => {
    setIsRefetching(query.isRefetching)
  }, [query.isRefetching, setIsRefetching])

  if (query.isError && !query.data) {
    return <div className="text-destructive p-4 text-sm">加载收藏失败。</div>
  }

  if (!query.data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-1 py-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <P1CollectionSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">没有符合条件的项目。</div>
  }

  return (
    <SingleColumnVirtualList
      appendPlaceholderCount={P1_COLLECTION_PANEL_LIMIT}
      className="px-1 py-1"
      estimateSize={84}
      gap={4}
      getKey={(item) => `${item.resourceType}-${item.item.id}`}
      hasMore={!query.isError && !!query.hasNextPage}
      isFetchingMore={query.isFetchingNextPage}
      items={items}
      onNearBottom={() => query.fetchNextPage()}
      renderItem={(item) => <P1CollectionItem item={item.item} resourceType={item.resourceType} />}
      renderPlaceholder={() => <P1CollectionSkeleton />}
      rootClassName="flex-1"
      scrollAreaKey={`collection-panel:p1:${username ?? 'me'}:${resourceType}`}
      showBackToTop
    />
  )
}

function P1CollectionItem({
  item,
  resourceType,
}: {
  item: P1PanelCollectionItem
  resourceType: P1PanelResourceType
}) {
  const { pathname } = useLocation()
  const meta = getP1CollectionItemMeta(item, resourceType)
  const active = pathname === meta.to

  return (
    <MyLink
      className={cn(
        'group hover:bg-accent flex min-h-20 cursor-default flex-row gap-3 rounded-md p-2 transition-colors',
        active && 'bg-accent',
      )}
      to={meta.to}
      onClick={(event) => {
        if (active) event.preventDefault()
      }}
    >
      {meta.image ? (
        <Image
          className="size-14 shrink-0 overflow-hidden rounded-md border shadow-xs"
          imageClassName={meta.imageContain ? 'object-contain' : undefined}
          imageSrc={meta.image}
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-md border shadow-xs">
          <span className={meta.fallbackIcon} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-2 text-sm font-medium">{meta.title}</div>
        {meta.subtitle && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{meta.subtitle}</div>
        )}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs shadow-none">
            {meta.kind}
          </Badge>
          {meta.count !== undefined && (
            <Badge variant="secondary" className="text-xs shadow-none">
              {meta.count}
            </Badge>
          )}
        </div>
      </div>
    </MyLink>
  )
}

function getP1CollectionItemMeta(item: P1PanelCollectionItem, resourceType: P1PanelResourceType) {
  if (resourceType === 'index') {
    const index = item as SlimIndex
    return {
      count: `${index.total} 项`,
      fallbackIcon: 'i-mingcute-list-check-3-line text-lg',
      image: undefined,
      imageContain: false,
      kind: '目录',
      subtitle: index.user?.nickname ? `by ${index.user.nickname}` : undefined,
      title: getIndexDisplayTitle(index),
      to: `/index/${index.id}`,
    }
  }

  const mono = item as P1SlimMono
  const title = mono.nameCN || mono.name
  return {
    count: mono.comment > 0 ? `${mono.comment} 吐槽` : undefined,
    fallbackIcon:
      resourceType === 'character'
        ? 'i-mingcute-user-3-line text-lg'
        : 'i-mingcute-idcard-line text-lg',
    image: mono.images?.grid || mono.images?.medium || mono.images?.small,
    imageContain: true,
    kind: resourceType === 'character' ? '角色' : '人物',
    subtitle: title === mono.name ? mono.info : mono.name,
    title,
    to: `/${resourceType}/${mono.id}`,
  }
}

function P1CollectionSkeleton() {
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
