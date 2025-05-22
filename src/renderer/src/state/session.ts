import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const isRefreshingTokenAtom = atom(false)

export const userIdAtom = atomWithStorage<string | null>('current_user_id', null)
