import SearchContent from '@renderer/components/search/content'
import Sort from '@renderer/components/search/sort'
import { Separator } from '@renderer/components/ui/separator'
import { searchParamAtom } from '@renderer/state/search'
import { useAtomValue } from 'jotai'

export default function SearchContentWrapper() {
  const searchParm = useAtomValue(searchParamAtom)
  return (
    searchParm && (
      <div className="flex flex-col gap-5">
        <Separator className="w-full" />
        <div className="px-10">
          <Sort />
        </div>
        <div className="px-10">
          <SearchContent searchParm={searchParm} />
        </div>
      </div>
    )
  )
}
