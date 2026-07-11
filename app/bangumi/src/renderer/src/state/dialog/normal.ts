import { dialogAtomFactory } from '@renderer/state/utils'

export type LoginDialogContent = {
  onSuccess?: () => void
  reason?: 'session-expired'
}

export const loginDialogAtom = dialogAtomFactory<LoginDialogContent>()
