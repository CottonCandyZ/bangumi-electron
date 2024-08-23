import SearchContentWrapper from '@renderer/components/search/content-wrapper'
import FilterButton from '@renderer/components/search/filter-button'
import SearchInput from '@renderer/components/search/input'
import SubjectTypeFilter from '@renderer/components/search/type-filter'

export default function Search() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <SearchInput />
      </div>
      <div className="grid grid-cols-[minmax(auto,_max-content)_min-content_min-content] gap-2 px-3">
        <SubjectTypeFilter />
        <FilterButton />
      </div>
      <SearchContentWrapper />
    </div>
  )
}
