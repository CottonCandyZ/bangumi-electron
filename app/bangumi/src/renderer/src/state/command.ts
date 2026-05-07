import { atom } from 'jotai'

export type CommandPanelMode = 'palette' | 'subject-search'

export const commandPanelAtom = atom<{
  open: boolean
  mode: CommandPanelMode
}>({
  open: false,
  mode: 'palette',
})
