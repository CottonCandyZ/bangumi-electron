import { CollectionType } from '@renderer/data/types/collection'
import { atom } from 'jotai'

const sidePanelCollectionTypeFilterMapAtom = atom(new Map<string, CollectionType>())

export const sidePanelCollectionTypeFilterAtom = atom(
  (get) => {
    return get(sidePanelCollectionTypeFilterMapAtom)
  },
  (get, set, id: string, value: CollectionType) => {
    set(
      sidePanelCollectionTypeFilterMapAtom,
      new Map(get(sidePanelCollectionTypeFilterMapAtom)).set(id, value),
    )
  },
)
