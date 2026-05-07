import { MasonryInfiniteGrid } from '@egjs/react-infinitegrid'
import { CollectionItem } from '@renderer/modules/common/collections/grid/item'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { gridCache } from '@renderer/state/global-var'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { useSetAtom } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import { useSession } from '@renderer/data/hooks/session'

export function CollectionsGrid({
  collectionType,
  subjectType,
}: {
  collectionType: CollectionType
  subjectType: SubjectType
}) {
  const userInfo = useSession()
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
    if (new Set(items.map((item) => item.data.subject_id)).size !== items.length)
      collectionsQuery.refetch()
  }, [items, collectionsQuery])
  useEffect(() => {
    setIsRefetching(collectionsQuery.isRefetching)
  }, [collectionsQuery.isRefetching, setIsRefetching])
  if (!collections)
    return (
      <div className="relative flex flex-col items-center justify-start gap-5 overflow-hidden p-1">
        <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-1">
          {Array(20)
            .fill(undefined)
            .map((_, index) => (
              <CollectionSkeleton key={index} />
            ))}
        </div>
      </div>
    )
  return (
    <ScrollArea.Root className="group/scroll relative h-full w-full overflow-hidden">
      <MasonryInfiniteGrid
        ref={igRef}
        // Make the InfiniteGrid wrapper be the Base UI viewport so scrolling is observed correctly.
        tag={ScrollArea.Viewport as unknown as string}
        // Make the InfiniteGrid container be the Base UI content wrapper so thumb updates when content grows.
        container
        containerTag={ScrollArea.Content as unknown as string}
        onChangeScroll={() => {
          gridCache.set(`${subjectType}-${collectionType}`, igRef.current?.getStatus())
        }}
        onRenderComplete={() => {
          gridCache.set(`${subjectType}-${collectionType}`, igRef.current?.getStatus())
        }}
        className="h-full w-full overflow-x-hidden px-1 py-1 focus-visible:outline-hidden"
        useResizeObserver
        observeChildren
        placeholder={<CollectionSkeleton />}
        align="stretch"
        maxStretchColumnSize={384}
        gap={4}
        onRequestAppend={(e) => {
          if (
            !collectionsQuery.isError &&
            collectionsQuery.hasNextPage &&
            !collectionsQuery.isFetchingNextPage
          ) {
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

      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
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
