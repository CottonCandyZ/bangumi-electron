import SearchContentWrapper from '@renderer/components/search/content-wrapper'
import SearchInput from '@renderer/components/search/input'
import SubjectTypeFilter from '@renderer/components/search/type-filter'

export default function Search() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="px-10">
        <SearchInput />
      </div>
      <div className="px-10">
        <SubjectTypeFilter />
      </div>
      <SearchContentWrapper />
    </div>
  )
}