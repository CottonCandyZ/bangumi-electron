import { dialogAtomFactory } from '@renderer/state/utils'

export type LoginDialogContent = {
  reason?: 'session-expired'
}

export const loginDialogAtom = dialogAtomFactory<LoginDialogContent>()
