import SubjectTypeFilterButtons from '@renderer/components/serach/filter-subject-type-buttons'
import { SubjectType } from '@renderer/data/types/subject'
import { Dispatch, SetStateAction } from 'react'

export default function Filter({
  type: { typeFilter, setTypeFilter },
}: {
  type: {
    typeFilter: Set<SubjectType>
    setTypeFilter: Dispatch<SetStateAction<Set<SubjectType>>>
  }
}) {
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
      }}
    />
  )
}
