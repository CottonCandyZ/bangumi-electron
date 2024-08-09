import SearchItemCard from '@renderer/components/serach/search-item-card'
import { useInfinityQuerySearch } from '@renderer/data/hooks/api/search'
import { SearchParm } from '@renderer/data/types/search'
import { useEffect, useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'

export default function SearchContent({ searchParm }: { searchParm: SearchParm }) {
  const searchResultQuery = useInfinityQuerySearch({
    searchParm,
  })
  const searchResult = searchResultQuery.data
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (searchResultQuery.hasNextPage && !searchResultQuery.isFetchingNextPage)
            searchResultQuery.fetchNextPage()
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
  }, [bottomRef, searchResult])
  if (!searchResult) return null

  return (
    <div className="relative flex flex-col items-center justify-center gap-5">
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 py-2">
        {searchResult.pages.map((group, page) => (
          <Fragment key={page}>
            {group.data.map((item) => (
              <SearchItemCard searchItem={item} key={item.id} />
            ))}
          </Fragment>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 -z-10 h-64" ref={bottomRef}></div>
      <div className="w-full text-center">
        {searchResultQuery.isFetchingNextPage ? (
          <span className="i-mingcute-loading-line animate-spin text-2xl" />
        ) : (
          !searchResultQuery.hasNextPage && (
            <span className="text-sm font-medium text-muted-foreground">就这么多了！</span>
          )
        )}
      </div>
    </div>
  )
}
