import { SubjectTypeFilterButtons } from '@renderer/modules/main/search/type-filter/filter-subject-type-buttons'
import { useSearchParams } from '@renderer/hooks/use-search-params'

export function SubjectTypeFilter() {
  const { setTypeFilters, typeFilters } = useSearchParams()
  return (
    <SubjectTypeFilterButtons
      filter={new Set([...typeFilters].map(Number))}
      onFilterClick={(value) => {
        // if value in types, remove it, else add it
        if (value === null) {
          setTypeFilters([])
        } else if (typeFilters.includes(value)) {
          setTypeFilters(typeFilters.filter((type) => type !== value))
        } else {
          setTypeFilters([...typeFilters, value])
        }
      }}
    />
  )
}
