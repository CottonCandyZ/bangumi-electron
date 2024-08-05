import { SubjectType } from '@renderer/data/types/subject'
import { atom } from 'jotai'

export type LeftPanelName = 'collection'

export type RightPanelName = 'subjectInfo'

export const navOpenAtom = atom(false)

export const leftPanelOpenAtom = atom(false)

export const rightPanelOpenAtom = atom(false)

export const leftPanelOpenContentAtom = atom<LeftPanelName | null>(null)

export const rightPanelOpenContentAtom = atom<RightPanelName | null>(null)

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

// right

export const rightPanelButtonAtomAction = atom(
  (get) => get(rightPanelOpenAtom),
  (_get, set, name: RightPanelName | null, open: boolean) => {
    if (!open) set(rightPanelOpenAtom, false)
    else {
      set(rightPanelOpenAtom, true)
      set(rightPanelOpenContentAtom, name)
    }
  },
)
