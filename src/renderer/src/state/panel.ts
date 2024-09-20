import { SubjectType } from '@renderer/data/types/subject'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type LeftPanelName = 'collection'

export type RightPanelName = 'subjectInfo'

export const navOpenAtom = atom(false)

export const leftPanelOpenAtom = atom(false)

export const rightPanelOpenAtom = atom(false)

export const leftPanelOpenContentAtom = atom<LeftPanelName | null>(null)

export const leftPanelWidth = atomWithStorage('app-sidebar-width', 248)

export const rightPanelWidth = atomWithStorage('app-right-panel-width', 248)

// export const rightPanelOpenContentAtom = atom<RightPanelName | null>(null)

// left

export const collectionPanelSubjectTypeAtom = atom<keyof typeof SubjectType>('anime')

// action
export const nvaCollectionButtonAtomAction = atom(
  (get) => ({
    openState: get(leftPanelOpenAtom),
    subjectType: get(collectionPanelSubjectTypeAtom),
  }),
  (_get, set, subjectType: keyof typeof SubjectType, open: boolean) => {
    if (!open) set(leftPanelOpenAtom, false)
    else {
      set(leftPanelOpenAtom, true)
      set(leftPanelOpenContentAtom, 'collection')
      set(collectionPanelSubjectTypeAtom, subjectType)
    }
  },
)

export const triggerLeftOpenAtomAction = atom(null, (get, set) => {
  if (get(leftPanelOpenAtom)) set(leftPanelOpenAtom, false)
  else {
    if (get(leftPanelOpenContentAtom) === null) {
      set(leftPanelOpenAtom, true)
      set(leftPanelOpenContentAtom, 'collection')
    } else {
      set(leftPanelOpenAtom, true)
    }
  }
})

// right

// export const rightPanelButtonAtomAction = atom(
//   (get) => get(rightPanelOpenAtom),
//   (_get, set, name: RightPanelName | null, open: boolean) => {
//     if (!open) set(rightPanelOpenAtom, false)
//     else {
//       set(rightPanelOpenAtom, true)
//       set(rightPanelOpenContentAtom, name)
//     }
//   },
// )
