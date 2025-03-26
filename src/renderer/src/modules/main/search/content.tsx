import { BigPagination } from '@renderer/components/big-pagination'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySearch } from '@renderer/data/hooks/api/search'
import { SearchParam } from '@renderer/data/types/search'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { SearchItemCard } from '@renderer/modules/main/search/item-card'
import { setScrollPositionAction } from '@renderer/state/scroll'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function SearchContent({ searchParam }: { searchParam: SearchParam }) {
  const [total, setTotal] = useState(0)
  const { setOffset, offset } = useSearchParams(() => {
    setTotal(0)
  })
  const { pathname } = useLocation()
  const updateScrollPosition = useSetAtom(setScrollPositionAction)
  const limit = 20

  const searchResultQuery = useQuerySearch({
    searchParam,
    limit,
    offset,
    keepPreviousData: false,
  })
  const searchResult = searchResultQuery.data

  useEffect(() => {
    if (searchResult !== undefined) {
      setTotal(searchResult.total)
    }
  }, [searchResult, searchParam])

  // if (searchResult === undefined)
  //   return (
  //     <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 px-10">
  //       <SkeletonList />
  //     </div>
  //   )

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 px-10">
        {searchResultQuery.isLoading ? (
          <SkeletonList />
        ) : (
          searchResult?.data.map((item) => <SearchItemCard searchItem={item} key={item.id} />)
        )}
      </div>
      <div className="sticky bottom-0 w-full border-t bg-background py-3">
        {total > 0 && (
          <BigPagination
            total={Math.ceil(total / limit)}
            value={Math.floor(offset / 20) + 1}
            onValueChanged={(value) => {
              setOffset((value - 1) * limit)
              updateScrollPosition(125, pathname)
            }}
          />
        )}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <>
      {Array(20)
        .fill(0)
        .map((_, index) => (
          <Skeleton key={index} className="h-52 w-full" />
        ))}
    </>
  )
}
