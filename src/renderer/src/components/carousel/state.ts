import { sectionPath } from '@renderer/data/types/web'
import { create } from 'zustand'

interface activeSection {
  sectionPath: sectionPath | null
  setActiveSection: (sectionPath: sectionPath | null) => void
}
export const useActiveSection = create<activeSection>()((set) => ({
  sectionPath: null,
  setActiveSection: (sectionPath) => set({ sectionPath }),
}))
