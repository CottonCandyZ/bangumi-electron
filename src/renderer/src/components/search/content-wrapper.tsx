import SearchContent from '@renderer/components/search/content'
import Sort from '@renderer/components/search/sort'
import { Separator } from '@renderer/components/ui/separator'
import { searchParamAtom } from '@renderer/state/search'
import { useAtomValue } from 'jotai'

export default function SearchContentWrapper() {
  const searchParam = useAtomValue(searchParamAtom)
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
