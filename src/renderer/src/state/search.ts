import { SearchParam } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import { atom } from 'jotai'

export const searchParamAtom = atom<SearchParam | null>(null)

export const searchSubjectTypeFilterAtom = atom(new Set<SubjectType>())

export const searchPaginationOffsetAtom = atom(0)

export const searchSortAtom = atom<SearchParam['sort']>('match')

export const isSearchLoadingAtom = atom(false)

export const searchKeywordActionAtom = atom(null, (get, set, keyword: string) => {
  set(searchPaginationOffsetAtom, 0)
  set(searchParamAtom, {
    keyword,
    filter: { type: [...get(searchSubjectTypeFilterAtom)] },
    sort: get(searchSortAtom),
  })
  set(isSearchLoadingAtom, true)
})

export const searchSubjectTypeFilterActionAtom = atom(null, (get, set) => {
  if (get(searchParamAtom) !== null) {
    set(searchPaginationOffsetAtom, 0)
    set(searchParamAtom, {
      ...get(searchParamAtom),
      filter: { type: [...get(searchSubjectTypeFilterAtom)] },
      sort: get(searchSortAtom),
    })
    set(isSearchLoadingAtom, true)
  }
})

export const searchSortActionAtom = atom(null, (get, set) => {
  if (get(searchParamAtom) !== null) {
    set(searchPaginationOffsetAtom, 0)
    set(searchParamAtom, {
      ...get(searchParamAtom),
      filter: { ...get(searchParamAtom)?.filter },
      sort: get(searchSortAtom),
    })
    set(isSearchLoadingAtom, true)
  }
})
