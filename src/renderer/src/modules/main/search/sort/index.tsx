import { SortButton } from '@renderer/modules/main/search/sort/sort-buttons'
import { searchSortActionAtom, searchSortAtom } from '@renderer/state/search'
import { useAtom, useSetAtom } from 'jotai'

export function Sort() {
  const [sort, setSort] = useAtom(searchSortAtom)
  const searchAction = useSetAtom(searchSortActionAtom)

  return (
    <SortButton
      value={sort}
      onValueChanged={(value) => {
        setSort(value)
        searchAction()
      }}
    />
  )
}
