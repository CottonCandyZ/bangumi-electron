import { CollectionType } from '@renderer/data/types/collection'
import { create } from 'zustand'

type CollectionTypeFilter = {
  currentTypeFilter: Map<string, CollectionType>
  setCurrentTypeFilter: (id: string, value: CollectionType) => void
}

export const useCollectionTypeFilter = create<CollectionTypeFilter>()((set) => ({
  currentTypeFilter: new Map<string, CollectionType>(),
  setCurrentTypeFilter: (id, value) =>
    set((pre) => ({ currentTypeFilter: new Map(pre.currentTypeFilter).set(id, value) })),
}))
