import { HoverEpisodeDetailType } from '@renderer/modules/episodes/grid/hover-content'
import { atom } from 'jotai'

export const hoverCardOpenAtom = atom(false)

let timeId: ReturnType<typeof setTimeout> | undefined

export const hoverCardOpenAtomAction = atom(
  null,
  (_get, set, value: boolean, closeDelay: number = 50, openDelay: number = 200) => {
    clearTimeout(timeId)
    if (!value) {
      timeId = setTimeout(() => set(hoverCardOpenAtom, value), closeDelay)
    } else timeId = setTimeout(() => set(hoverCardOpenAtom, value), openDelay)
  },
)

export const triggerClientRectAtom = atom<DOMRect | null>(null)

export const hoverCardEpisodeContentAtom = atom<HoverEpisodeDetailType | null>(null)
