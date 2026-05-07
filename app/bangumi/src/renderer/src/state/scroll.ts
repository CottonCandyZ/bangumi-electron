import { scrollCache } from '@renderer/state/global-var'
import { atom } from 'jotai'

export const mainPanelScrollPositionAtom = atom(0)

export const scrollViewportAtom = atom<HTMLElement | null>(null)

export const setScrollPositionAction = atom(
  null,
  (get, _set, scrollPosition: number, pathname: string) => {
    const viewport = get(scrollViewportAtom)
    if (viewport) {
      viewport.scrollTo({
        top: scrollPosition,
      })
      scrollCache.set(pathname, scrollPosition)
    }
  },
)
