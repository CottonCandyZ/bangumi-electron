import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { CollectionItem } from '@renderer/modules/common/collections/grid/item'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { useSetAtom } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'

const COLLECTION_PANEL_LIMIT = 10

export function CollectionsGrid({
  collectionType,
  subjectType,
  showEpisodeList,
  useOneBasedEpisodeSort,
  username,
}: {
  collectionType: CollectionType
  subjectType: SubjectType
  showEpisodeList: boolean
  useOneBasedEpisodeSort: boolean
  username: string
}) {
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
  const setIsRefetching = useSetAtom(collectionPanelIsRefetchingAtom)
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
  useEffect(() => {
    setIsRefetching(isRefetching)
  }, [isRefetching, setIsRefetching])
  if (!collections)
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-1 py-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <CollectionSkeleton key={index} />
        ))}
      </div>
    )

  if (items.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">没有符合条件的项目。</div>
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
      scrollAreaKey={`collection-panel:${username}:${subjectType}:${collectionType}:${showEpisodeList}:${useOneBasedEpisodeSort}`}
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
