import { isNetworkUnavailableError } from '@renderer/lib/utils/network'
import { useOnline } from '@renderer/hooks/use-online'
import { useCollectionSyncOverview } from '@renderer/modules/common/collections/sync-dialog'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { CollectionItem } from '@renderer/modules/common/collections/grid/item'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { DelayedLoading } from '@renderer/components/delayed-loading'
import { QueryFallback } from '@renderer/components/query-fallback'

const COLLECTION_PANEL_LIMIT = 10

export function CollectionsGrid({
  collectionType,
  subjectType,
  showEpisodeList,
  useOneBasedEpisodeSort,
  username,
  emptyContent,
}: {
  collectionType: CollectionType
  subjectType: SubjectType
  showEpisodeList: boolean
  useOneBasedEpisodeSort: boolean
  username: string
  emptyContent?: ReactNode
}) {
  const online = useOnline()
  const listComplete = useCollectionSyncOverview((overview) => overview.listComplete).data
  const collectionsQuery = useInfinityQueryCollectionsByUsername({
    username,
    collectionType: collectionType,
    subjectType: subjectType,
    limit: COLLECTION_PANEL_LIMIT,
    enabled: !!username,
    needKeepPreviousData: false,
    refetchPageLimit: 0,
  })
  const {
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = collectionsQuery
  const handledDuplicateSignatureRef = useRef<string | null>(null)
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
  useEffect(() => {
    const subjectIds = items.map((item) => item.data.subject_id)
    if (new Set(subjectIds).size === subjectIds.length) {
      handledDuplicateSignatureRef.current = null
      return
    }

    const duplicateSignature = subjectIds.join(',')
    if (handledDuplicateSignatureRef.current === duplicateSignature || isFetching || isRefetching) {
      return
    }

    handledDuplicateSignatureRef.current = duplicateSignature
    refetch()
  }, [isFetching, isRefetching, items, refetch])
  if (!collections && isError && (!online || isNetworkUnavailableError(collectionsQuery.error))) {
    return (
      <div className="text-muted-foreground flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-xs">
        <p>暂无离线收藏</p>
        <p>请在网络恢复后同步收藏。</p>
      </div>
    )
  }
  if (!collections && isError)
    return (
      <QueryFallback layout="panel" label="收藏" error={collectionsQuery.error} onRetry={refetch} />
    )
  if (!collections)
    return (
      <DelayedLoading>
        <div className="flex min-h-0 flex-1 flex-col gap-1 px-1 py-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <CollectionSkeleton key={index} />
          ))}
        </div>
      </DelayedLoading>
    )

  if (items.length === 0) {
    if (emptyContent !== undefined) return emptyContent
    return (
      <div className="text-muted-foreground flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-xs">
        {!online && !listComplete ? (
          <>
            <p>暂无离线收藏</p>
            <p>请联网后同步收藏。</p>
          </>
        ) : (
          <p>没有符合条件的项目。</p>
        )}
      </div>
    )
  }

  return (
    <SingleColumnVirtualList
      items={items}
      getKey={(item) => item.data.subject_id}
      renderItem={(item) => (
        <CollectionItem
          collectionItemInfo={item.data}
          showEpisodeList={showEpisodeList}
          useOneBasedEpisodeSort={useOneBasedEpisodeSort}
        />
      )}
      appendPlaceholderCount={collections.pages[0]?.data.length || COLLECTION_PANEL_LIMIT}
      className="px-1 py-1"
      estimateSize={showEpisodeList ? 156 : 84}
      gap={4}
      hasMore={!isError && !!hasNextPage}
      isFetchingMore={isFetchingNextPage}
      onNearBottom={() => fetchNextPage()}
      renderPlaceholder={() => <CollectionSkeleton />}
      rootClassName="flex-1"
      scrollMemoryKey={`collection-panel:${username}:${subjectType}:${collectionType}:${showEpisodeList}:${useOneBasedEpisodeSort}`}
      showBackToTop
    />
  )
}

function CollectionSkeleton() {
  return (
    <div className="flex h-20 w-full flex-row gap-2 p-2">
      <Skeleton className="size-12 shrink-0" />
      <div className="flex w-full flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}
