import { SubjectId } from '@renderer/data/types/bgm'
import { atom } from 'jotai'

export type AlertDialogContent = 'login-delete-account' | 'delete-subject-collection'

export const openAlertDialogAtom = atom(false)

export const alertDialogContentAtom = atom<AlertDialogContent | null>(null)

export const openAlertDialogAction = atom(null, (_get, set, contentName: AlertDialogContent) => {
  set(openAlertDialogAtom, true)
  set(alertDialogContentAtom, contentName)
})

// delete account
export type DeleteLoginAccountProps = {
  email: string
  onDeleted: () => void
}

export const loginDeleteAccountPropsAtom = atom<DeleteLoginAccountProps | null>(null)

export const openLoginDeleteAccountAction = atom(
  null,
  (_get, set, loginDeleteAccountProps: DeleteLoginAccountProps) => {
    set(openAlertDialogAction, 'login-delete-account')
    set(loginDeleteAccountPropsAtom, loginDeleteAccountProps)
  },
)

// delete collection
export type DeleteCollectionProps = {
  subjectId: SubjectId
}

export const deleteCollectionPropsAtom = atom<DeleteCollectionProps | null>(null)

export const openDeleteCollectionAction = atom(
  null,
  (_get, set, loginDeleteAccountProps: DeleteCollectionProps) => {
    set(openAlertDialogAction, 'delete-subject-collection')
    set(deleteCollectionPropsAtom, loginDeleteAccountProps)
  },
)