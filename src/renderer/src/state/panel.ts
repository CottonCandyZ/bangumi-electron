import { SubjectType } from '@renderer/data/types/subject'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PanelName = keyof typeof SubjectType

type navCollapsed = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export const useNavCollapsed = create<navCollapsed>()((set) => ({
  collapsed: true,
  setCollapsed: (collapsed) => set({ collapsed }),
}))

type currentPanel = {
  panelName: PanelName | null
  setPanelName: (panelName: PanelName | null) => void
}

export const usePanelName = create<currentPanel>()(
  persist(
    (set) => ({
      panelName: null,
      setPanelName: (panelName) => set({ panelName }),
    }),
    {
      name: 'current-panel-name',
    },
  ),
)
