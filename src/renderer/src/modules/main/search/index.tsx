import { SearchContentWrapper } from '@renderer/modules/main/search/content-wrapper'
import { FilterButton } from '@renderer/modules/main/search/filter-button'
import { SearchInput } from '@renderer/modules/main/search/input'
import { SubjectTypeFilter } from '@renderer/modules/main/search/type-filter'

export function Search() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <SearchInput />
      </div>
      <div className="grid grid-cols-[minmax(auto,_max-content)_min-content] gap-2 px-3">
        <SubjectTypeFilter />
        <FilterButton />
      </div>
      <SearchContentWrapper />
    </div>
  )
}
