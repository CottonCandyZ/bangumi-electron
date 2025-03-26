import { useSearchParams } from '@renderer/hooks/use-search-params'
import { SortButton } from '@renderer/modules/main/search/sort/sort-buttons'

export function Sort() {
  const { sort, setSort } = useSearchParams()

  return (
    <SortButton
      value={sort}
      onValueChanged={(value) => {
        setSort(value)
      }}
    />
  )
}
