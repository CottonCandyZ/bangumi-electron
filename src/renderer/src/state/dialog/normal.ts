import { dialogTypeAtom, openDialogAtom } from '@renderer/state/dialog/index'
import { atom } from 'jotai'

export type DialogContentName = 'login-form'

export const normalDialogContentAtom = atom<DialogContentName | null>(null)

export const openDialogAction = atom(null, (_get, set, contentName: DialogContentName) => {
  set(openDialogAtom, true)
  set(dialogTypeAtom, 'normal')
  set(normalDialogContentAtom, contentName)
})
