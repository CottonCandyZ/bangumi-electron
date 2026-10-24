import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const userIdAtom = atomWithStorage<string | null>('current_user_id', null)

// Online authorization is separate from the locally remembered account.
// A refresh rejected in the command/reply window must also sign out the main window.
export const authRequiredUserIdAtom = atomWithStorage<string | null>('auth_required_user_id', null)
export const sessionNeedsLoginAtom = atom((get) => {
  const userId = get(userIdAtom)
  return !!userId && get(authRequiredUserIdAtom) === userId
})
