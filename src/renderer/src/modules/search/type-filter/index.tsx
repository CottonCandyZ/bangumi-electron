import SubjectTypeFilterButtons from '@renderer/modules/search/type-filter/filter-subject-type-buttons'
import {
  searchSubjectTypeFilterActionAtom,
  searchSubjectTypeFilterAtom,
} from '@renderer/state/search'
import { useAtom, useSetAtom } from 'jotai'

export default function SubjectTypeFilter() {
  const [typeFilter, setTypeFilter] = useAtom(searchSubjectTypeFilterAtom)
  const searchSubjectTypeFilterAction = useSetAtom(searchSubjectTypeFilterActionAtom)
  return (
    <SubjectTypeFilterButtons
      filter={typeFilter}
      onFilterClick={(value) => {
        if (value === null) setTypeFilter(new Set())
        else {
          if (!typeFilter.has(value)) setTypeFilter((filter) => new Set(filter).add(value))
          else
            setTypeFilter((filter) => {
              const newSet = new Set(filter)
              newSet.delete(value)
              return newSet
            })
        }
        searchSubjectTypeFilterAction()
      }}
    />
  )
}
