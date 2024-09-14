import { MasonryInfiniteGrid } from '@egjs/react-infinitegrid'
import { CollectionItem } from '@renderer/modules/collections/grid/item'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { gridCache } from '@renderer/state/global-var'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'

export function CollectionsGrid({
  collectionType,
  subjectType,
}: {
  collectionType: CollectionType
  subjectType: SubjectType
}) {
  const userInfoQuery = useQueryUserInfo()
  const userInfo = userInfoQuery.data
  const collectionsQuery = useInfinityQueryCollectionsByUsername({
    username: userInfo?.username,
    collectionType: collectionType,
    subjectType: subjectType,
    enabled: !!userInfo,
    needKeepPreviousData: false,
  })
  const igRef = useRef<MasonryInfiniteGrid>(null)
  const setIsRefetching = useSetAtom(collectionPanelIsRefetchingAtom)
  useEffect(() => {
    if (gridCache.has(`${subjectType}-${collectionType}`)) {
      const status = gridCache.get(`${subjectType}-${collectionType}`)
      if (status) {
        igRef.current?.setStatus(status)
      }
    }
  }, [subjectType, collectionType, igRef])
  const collections = collectionsQuery.data
  const items = collections
    ? collections.pages.flatMap((page, index) =>
        page.data.map((item) => ({
          data: item,
          index,
        })),
      )
    : []
  useEffect(() => {
    setIsRefetching(collectionsQuery.isRefetching)
  }, [collectionsQuery.isFetching])
  if (!collections)
    return (
      <div className="relative flex flex-col items-center justify-start gap-5 overflow-hidden p-1">
        <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] gap-1">
          {Array(20)
            .fill(undefined)
            .map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
        </div>
      </div>
    )
  return (
    <div className="h-full overflow-hidden py-1 pr-0.5">
      <MasonryInfiniteGrid
        ref={igRef}
        onChangeScroll={() => {
          gridCache.set(`${subjectType}-${collectionType}`, igRef.current?.getStatus())
        }}
        onRenderComplete={() => {
          gridCache.set(`${subjectType}-${collectionType}`, igRef.current?.getStatus())
        }}
        className="h-full overflow-x-hidden px-1 pr-0.5"
        useResizeObserver
        container
        observeChildren
        placeholder={<Skeleton className="h-20 w-full max-w-96" />}
        align="stretch"
        maxStretchColumnSize={384}
        gap={4}
        onRequestAppend={(e) => {
          if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage) {
            e.wait()
            e.currentTarget.appendPlaceholders(
              collections.pages[0].data.length,
              (+e.groupKey! || 0) + 1,
            )
            collectionsQuery.fetchNextPage().then(() => e.ready())
          }
        }}
      >
        {items.map((item) => {
          return (
            <div key={item.data.subject_id} data-grid-groupkey={item.index}>
              <CollectionItem collectionItemInfo={item.data} />
            </div>
          )
        })}
      </MasonryInfiniteGrid>
    </div>
  )
}
