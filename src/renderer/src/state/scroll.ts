import { scrollCache } from '@renderer/state/global-var'
import { atom } from 'jotai'
import { OverlayScrollbars } from 'overlayscrollbars'

export const mainPanelScrollPositionAtom = atom(0)

export const scrollInstanceAtom = atom<OverlayScrollbars | null>(null)

export const setScrollPositionAction = atom(
  null,
  (get, _set, scrollPosition: number, pathname: string) => {
    const instance = get(scrollInstanceAtom)
    if (instance) {
      instance.elements().viewport.scrollTo({
        top: scrollPosition,
      })
      scrollCache.set(pathname, scrollPosition)
    }
  },
)
