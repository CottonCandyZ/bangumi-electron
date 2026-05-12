import type { SearchData } from '@renderer/data/types/search'
import { SearchSubjectRow } from '@renderer/modules/main/search/item-card'

export function SearchItemList({ searchItem }: { searchItem: SearchData }) {
  return <SearchSubjectRow searchItem={searchItem} />
}
