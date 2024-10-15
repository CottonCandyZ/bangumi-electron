import { atom } from 'jotai'

export type DialogType = 'sheet' | 'normal' | 'alert'

export const openDialogAtom = atom(false)

export const dialogTypeAtom = atom<DialogType>('sheet')
