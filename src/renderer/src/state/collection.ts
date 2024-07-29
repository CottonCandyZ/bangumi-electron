import { CollectionType } from '@renderer/data/types/collection'
import { create } from 'zustand'
import { persist, StorageValue } from 'zustand/middleware'

type CollectionTypeFilter = {
  currentTypeFilter: Map<string, CollectionType>
  setCurrentTypeFilter: (id: string, value: CollectionType) => void
}

export const useCollectionTypeFilter = create<CollectionTypeFilter>()(
  persist(
    (set, get) => ({
      currentTypeFilter: new Map<string, CollectionType>(),
      setCurrentTypeFilter: (id, value) =>
        set({ currentTypeFilter: new Map(get().currentTypeFilter).set(id, value) }),
    }),
    {
      name: 'panel-collection-type-filter',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          console.log(str)
          if (!str) return null
          const { state } = JSON.parse(str)
          return {
            state: {
              ...state,
              currentTypeFilter: new Map(state.currentTypeFilter),
            },
          }
        },
        setItem: (name, newValue: StorageValue<CollectionTypeFilter>) => {
          // functions cannot be JSON encoded
          const str = JSON.stringify({
            state: {
              ...newValue.state,
              currentTypeFilter: Array.from(newValue.state.currentTypeFilter.entries()),
            },
          })
          localStorage.setItem(name, str)
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
)
