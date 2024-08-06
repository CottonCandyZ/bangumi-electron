import CollectionItem from '@renderer/components/collections/grid/item'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'

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
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const setIsRefetching = useSetAtom(collectionPanelIsRefetchingAtom)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage)
            collectionsQuery.fetchNextPage()
        }
      },
      { threshold: 0.5 },
    )

    if (bottomRef.current) {
      observer.observe(bottomRef.current)
    }

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current)
      }
    }
  }, [bottomRef, collections])
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
  setIsRefetching(collectionsQuery.isRefetching)
  return (
    <div className={cn('relative flex flex-col items-center justify-center gap-5')}>
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] gap-1">
        {collections.pages.map((group, page) => (
          <Fragment key={page}>
            {group.data.map((collection) => (
              <CollectionItem key={collection.subject_id} collectionItemInfo={collection} />
            ))}
          </Fragment>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 -z-10 h-64" ref={bottomRef}></div>
      <div className="w-full text-center">
        {collectionsQuery.isFetchingNextPage ? (
          <span className="i-mingcute-loading-line animate-spin text-2xl" />
        ) : (
          !collectionsQuery.hasNextPage && (
            <span className="text-sm font-medium text-muted-foreground">就这么多了！</span>
          )
        )}
      </div>
    </div>
  )
}
