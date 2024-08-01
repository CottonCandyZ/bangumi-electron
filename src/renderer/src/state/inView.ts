import { create } from 'zustand'

type CollectionIsInView = {
  isInView: boolean
  setInView: (isInView: boolean) => void
}

export const useCollectionIsInView = create<CollectionIsInView>()((set) => ({
  isInView: false,
  setInView: (isInView) => set({ isInView }),
}))
