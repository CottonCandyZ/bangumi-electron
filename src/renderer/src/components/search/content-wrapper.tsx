import SearchContent from '@renderer/components/search/content'
import { searchParamAtom } from '@renderer/state/search'
import { useAtom } from 'jotai'

export default function SearchContentWrapper() {
  const [searchParm, setSearchParm] = useAtom(searchParamAtom)
  return searchParm && <SearchContent searchParm={searchParm} />
}
