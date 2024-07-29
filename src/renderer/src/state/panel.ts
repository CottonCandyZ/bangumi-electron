import { SubjectType } from '@renderer/data/types/subject'
import { create } from 'zustand'

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

export const usePanelName = create<currentPanel>()((set) => ({
  panelName: null,
  setPanelName: (panelName) => set({ panelName }),
}))
