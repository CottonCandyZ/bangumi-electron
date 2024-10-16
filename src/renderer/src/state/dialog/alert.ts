import { atom } from 'jotai'

export type AlertDialogContent = 'login-delete-account'

export const openAlertDialogAtom = atom(false)

export const alertDialogContentAtom = atom<AlertDialogContent | null>(null)

export const openAlertDialogAction = atom(null, (_get, set, contentName: AlertDialogContent) => {
  set(openAlertDialogAtom, true)
  set(alertDialogContentAtom, contentName)
})

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
