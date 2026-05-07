import { Separator } from '@renderer/components/ui/separator'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { SearchContent } from '@renderer/modules/main/search/content'
import { Sort } from '@renderer/modules/main/search/sort'

export function SearchContentWrapper() {
  const { getSearchParam } = useSearchParams()
  const searchParam = getSearchParam()

  return (
    searchParam && (
      <div className="flex flex-col gap-5">
        <Separator className="h-0 w-full border-b" />
        <div className="px-10">
          <Sort />
        </div>
        <SearchContent searchParam={searchParam} />
      </div>
    )
  )
}
