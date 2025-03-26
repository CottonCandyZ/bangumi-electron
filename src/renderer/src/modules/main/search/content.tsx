import { BigPagination } from '@renderer/components/big-pagination'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySearch } from '@renderer/data/hooks/api/search'
import { SearchParam } from '@renderer/data/types/search'
import { useSearchParams } from '@renderer/hooks/use-search-parms'
import { SearchItemCard } from '@renderer/modules/main/search/item-card'
import { setScrollPositionAction } from '@renderer/state/scroll'
import { useSetAtom } from 'jotai'
import { useLocation } from 'react-router-dom'

export function SearchContent({ searchParam }: { searchParam: SearchParam }) {
  const { setOffset, offset } = useSearchParams()
  const { pathname } = useLocation()
  const updateScrollPosition = useSetAtom(setScrollPositionAction)
  const limit = 20

  const searchResultQuery = useQuerySearch({
    searchParam,
    limit,
    offset,
  })
  const searchResult = searchResultQuery.data

  if (searchResult === undefined)
    return (
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 px-10">
        <SkeletonList />
      </div>
    )

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 px-10">
        {/* FIXME: 如果从缓存取出来的话，它仍然会做 fetch, query 里使用的了 keepPreviousData，这是为了保证在换页时，能够保持 pageNumberState，我觉得可以考虑把逻辑改一下，区分首次进入和换页 */}
        {searchResultQuery.isFetching ? (
          <SkeletonList />
        ) : (
          searchResult.data.map((item) => <SearchItemCard searchItem={item} key={item.id} />)
        )}
      </div>
      <div className="sticky bottom-0 w-full border-t bg-background py-3">
        <BigPagination
          total={Math.ceil(searchResult.total / searchResult.limit)}
          value={Math.floor(offset / 20) + 1}
          onValueChanged={(value) => {
            setOffset((value - 1) * searchResult.limit)
            updateScrollPosition(125, pathname)
          }}
        />
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
