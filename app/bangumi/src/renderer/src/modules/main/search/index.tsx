import { Separator } from '@renderer/components/ui/separator'
import { SearchContentWrapper } from '@renderer/modules/main/search/content-wrapper'
import { FilterButton } from '@renderer/modules/main/search/filter-button'
import { SearchInput } from '@renderer/modules/main/search/input'
import { SearchSummaryAction } from '@renderer/modules/main/search/content'
import { Sort } from '@renderer/modules/main/search/sort'
import { SubjectTypeFilter } from '@renderer/modules/main/search/type-filter'

export function Search() {
  return (
    <div className="flex h-full min-h-full w-full flex-col gap-4">
      <div className="px-3 pt-4">
        <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-row items-center justify-start">
          <div className="w-full min-w-72">
            <SearchInput />
          </div>
        </div>
      </div>
      <div className="px-3">
        <div className="mx-auto flex w-full max-w-4xl min-w-72 flex-row items-start justify-start gap-2 overflow-x-auto">
          <div className="shrink-0">
            <SubjectTypeFilter />
          </div>
          <div className="flex h-9 shrink-0 items-center px-1">
            <Separator orientation="vertical" className="h-5" />
          </div>
          <div className="shrink-0">
            <Sort />
          </div>
          <div className="shrink-0">
            <FilterButton />
          </div>
          <SearchSummaryAction />
        </div>
      </div>
      <SearchContentWrapper />
    </div>
  )
}
