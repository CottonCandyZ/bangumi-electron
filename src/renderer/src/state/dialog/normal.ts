import { atom } from 'jotai'

export type DialogContentName = 'login-form'

export const openDialogAtom = atom(false)

export const normalDialogContentAtom = atom<DialogContentName | null>(null)

export const openDialogAction = atom(null, (_get, set, contentName: DialogContentName) => {
  set(openDialogAtom, true)
  set(normalDialogContentAtom, contentName)
})
