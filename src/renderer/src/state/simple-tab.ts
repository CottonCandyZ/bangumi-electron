import { atom } from 'jotai'

const tabsFilerMapAtom = atom(new Map<string, string>())

export const tabFilerAtom = atom(
  (get) => {
    return get(tabsFilerMapAtom)
  },
  (get, set, id: string, value: string) => {
    set(tabsFilerMapAtom, new Map(get(tabsFilerMapAtom)).set(id, value))
  },
)
