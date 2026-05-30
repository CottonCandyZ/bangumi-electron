import type { SearchSubjectData } from '@renderer/data/types/search'
import { SearchSubjectRow } from '@renderer/modules/main/search/item-card'

export function SearchItemList({ searchItem }: { searchItem: SearchSubjectData }) {
  return <SearchSubjectRow searchItem={searchItem} />
}
