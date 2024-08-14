import BigPagination from '@renderer/components/search/big-pagination'
import SearchItemCard from '@renderer/components/search/item-card'

import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySearch } from '@renderer/data/hooks/api/search'
import { SearchParam } from '@renderer/data/types/search'
import { updateMainScrollPositionAtom } from '@renderer/state/scroll'
import { searchPaginationOffsetAtom } from '@renderer/state/search'
import { useAtom, useSetAtom } from 'jotai'

export default function SearchContent({ searchParam }: { searchParam: SearchParam }) {
  const [offset, setOffset] = useAtom(searchPaginationOffsetAtom)
  const updateScrollPosition = useSetAtom(updateMainScrollPositionAtom)
  const searchResultQuery = useQuerySearch({
    searchParam,
    offset,
  })
  const searchResult = searchResultQuery.data
  if (searchResult === undefined)
    return (
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 px-10">
        {Array(9)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} className="h-52 w-full" />
          ))}
      </div>
    )

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(25rem,_1fr))] gap-4 px-10">
        {searchResultQuery.isRefetching
          ? Array(9)
              .fill(0)
              .map((_, index) => <Skeleton key={index} className="h-52 w-full" />)
          : searchResult.data.map((item) => <SearchItemCard searchItem={item} key={item.id} />)}
      </div>
      <div className="sticky bottom-0 w-full border-t bg-background py-3">
        <BigPagination
          total={Math.ceil(searchResult.total / searchResult.limit)}
          value={Math.floor(offset / 20) + 1}
          onValueChanged={(value) => {
            setOffset((value - 1) * searchResult.limit)
            updateScrollPosition({ position: 160 })
          }}
        />
      </div>
    </div>
  )
}
