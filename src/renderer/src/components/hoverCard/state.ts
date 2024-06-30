import { create } from 'zustand'

interface activeId {
  sectionId: string
  id: string
}

interface activeHoverCard {
  activeId: activeId | null
  setActiveId: (activeId: activeId | null) => void
}
export const useActiveHoverCard = create<activeHoverCard>()((set) => ({
  activeId: null,
  setActiveId: (activeId) => set({ activeId }),
}))
