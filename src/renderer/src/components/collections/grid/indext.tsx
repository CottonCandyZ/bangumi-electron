import { Card, CardContent } from '@renderer/components/ui/card'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { useEffect, useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'

export default function CollectionsGrid() {
  const userInfoQuery = useQueryUserInfo()
  const userInfo = userInfoQuery.data
  const collectionsQuery = useInfinityQueryCollectionsByUsername({
    username: userInfo?.username,
    collectionType: CollectionType['在看'],
    subjectType: SubjectType['动画'],
    enabled: !!userInfo,
  })
  const collections = collectionsQuery.data
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const timeRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => {
    return () => {
      clearInterval(timeRef.current)
    }
  }, [])
  useEffect(() => {
    console.log(bottomRef.current)
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
      clearInterval(timeRef.current)
    }
  }, [bottomRef, collections])
  if (!collections) return null
  return (
    <div className="relative flex flex-col items-center justify-center gap-5">
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(24rem,_1fr))] gap-5">
        {collections.pages.map((group, page) => (
          <Fragment key={page}>
            {group.data.map((collection) => (
              <Card key={collection.subject_id} className="h-32">
                <CardContent className="p-2">
                  <div>{collection.subject.name_cn}</div>
                </CardContent>
              </Card>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-64" ref={bottomRef}></div>
      <div>
        {collectionsQuery.isFetchingNextPage ? (
          <span className="i-mingcute-loading-line animate-spin text-2xl" />
        ) : collectionsQuery.hasNextPage ? (
          ''
        ) : (
          'Nothing more to load'
        )}
      </div>
    </div>
  )
}
