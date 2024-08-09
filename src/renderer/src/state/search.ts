import { SearchParm } from '@renderer/data/types/search'
import { atom } from 'jotai'

export const searchParamAtom = atom<SearchParm | null>(null)
