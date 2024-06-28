import { sectionPath } from '@renderer/constants/types/web'
import { create } from 'zustand'

interface activeHoverCard {
  sectionPath: sectionPath | null
  index: number | null
  setActive: (sectionPath: sectionPath | null, index: number | null) => void
}
export const useCurrentHoverCard = create<activeHoverCard>()((set) => ({
  sectionPath: null,
  index: null,
  setActive: (sectionPath, index) => set({ sectionPath, index }),
}))
