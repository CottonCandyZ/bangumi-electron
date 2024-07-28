import { create } from 'zustand'

type activeId = string

interface activeHoverCard {
  activeId: activeId | null
  setActiveId: (activeId: activeId | null) => void
}
export const useActiveHoverCard = create<activeHoverCard>()((set) => ({
  activeId: null,
  setActiveId: (activeId) => set({ activeId }),
}))

type viewTransitionStatus = string | null
interface viewTransitionStatusSate {
  status: viewTransitionStatus
  setStatus: (status: viewTransitionStatus) => void
}

export const useViewTransitionStatusState = create<viewTransitionStatusSate>()((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}))
