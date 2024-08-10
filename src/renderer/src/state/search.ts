import { SearchParm } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import { atom } from 'jotai'

export const searchParamAtom = atom<SearchParm | null>(null)

export const searchSubjectTypeFilterAtom = atom(new Set<SubjectType>())

export const searchSortAtom = atom<'rank' | undefined>(undefined)

export const searchKeywordActionAtom = atom(null, (get, set, keyword: string) => {
  set(searchParamAtom, {
    keyword,
    filter: { type: [...get(searchSubjectTypeFilterAtom)] },
    sort: get(searchSortAtom),
  })
})

export const searchSubjectTypeFilterActionAtom = atom(null, (get, set) => {
  if (get(searchParamAtom) !== null) {
    set(searchParamAtom, {
      ...get(searchParamAtom),
      filter: { type: [...get(searchSubjectTypeFilterAtom)] },
      sort: get(searchSortAtom),
    })
  }
})

export const searchSortActionAtom = atom(null, (get, set) => {
  if (get(searchParamAtom) !== null) {
    set(searchParamAtom, {
      ...get(searchParamAtom),
      filter: { ...get(searchParamAtom)?.filter },
      sort: get(searchSortAtom),
    })
  }
})
