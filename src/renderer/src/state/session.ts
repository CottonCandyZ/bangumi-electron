import { atomWithStorage } from 'jotai/utils'

export const userIdAtom = atomWithStorage<string | null>('current_user_id', null)
