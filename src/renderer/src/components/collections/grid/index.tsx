import { MasonryInfiniteGrid } from '@egjs/react-infinitegrid'
import CollectionItem from '@renderer/components/collections/grid/item'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'

export default function CollectionsGrid({
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
  const collections = collectionsQuery.data
  const items = collections ? collections.pages.flatMap((item) => item.data) : []
  if (!collections)
    return (
      <div className="relative flex flex-col items-center justify-center gap-5">
        <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] gap-1">
          {Array(10)
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
        className="scroll h-full overflow-x-hidden px-1 pr-0.5"
        useResizeObserver
        container
        observeChildren
        align="start"
        gap={4}
        onRequestAppend={() => {
          if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage)
            collectionsQuery.fetchNextPage()
          console.log('hello')
        }}
      >
        {items.map((item, index) => {
          return (
            <div
              key={item.subject_id}
              data-grid-groupkey={Math.floor(index / 10)}
              className="w-full max-w-96"
            >
              <CollectionItem collectionItemInfo={item} />
            </div>
          )
        })}
      </MasonryInfiniteGrid>
    </div>
  )
}
