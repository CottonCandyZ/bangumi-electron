import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const userIdAtom = atomWithStorage<string | null>('current_user_id', null)

// Online authorization is separate from the locally remembered account.
export const authRequiredUserIdAtom = atom<string | null>(null)
export const sessionNeedsLoginAtom = atom((get) => {
  const userId = get(userIdAtom)
  return !!userId && get(authRequiredUserIdAtom) === userId
})
