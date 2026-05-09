import { SubjectType } from '@renderer/data/types/subject'
import type { Character } from '@renderer/data/types/character'
import type { RelatedSubject } from '@renderer/data/types/subject'
import type { MonoRelatedItem, MonoSubjectItem, MonoType } from '@renderer/data/types/mono'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type LeftPanelName = 'collection' | 'monoList'

export type RightPanelName = 'subjectInfo'

export type MonoListPanelTab =
  | {
      id: string
      type: 'subjects'
      title: string
      sourceTitle: string
      monoId: string
      monoType: MonoType
      subjects: MonoSubjectItem[]
    }
  | {
      id: string
      type: 'related'
      title: string
      sourceTitle: string
      monoId: string
      monoType: MonoType
      relatedItems: MonoRelatedItem[]
    }
  | {
      id: string
      type: 'subjectCharacters'
      title: string
      sourceTitle: string
      subjectId: string
      characters: Character[]
    }
  | {
      id: string
      type: 'subjectRelated'
      title: string
      sourceTitle: string
      subjectId: string
      relatedSubjects: RelatedSubject[]
    }

export const navOpenAtom = atom(false)

export const leftPanelOpenAtom = atom(false)

export const rightPanelOpenAtom = atom(false)

export const leftPanelOpenContentAtom = atom<LeftPanelName>('collection')

export const leftPanelWidth = atomWithStorage('app-sidebar-width', 248)

export const rightPanelWidth = atomWithStorage('app-right-panel-width', 248)

// export const rightPanelOpenContentAtom = atom<RightPanelName | null>(null)

// left

export const collectionPanelSubjectTypeAtom = atom<keyof typeof SubjectType>('anime')

export const monoListPanelTabsAtom = atom<MonoListPanelTab[]>([])

export const monoListPanelActiveTabIdAtom = atom<string | null>(null)

// action
export const nvaCollectionButtonAtomAction = atom(
  (get) => ({
    openState: get(leftPanelOpenAtom),
    openContent: get(leftPanelOpenContentAtom),
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
  set(leftPanelOpenAtom, !get(leftPanelOpenAtom))
})

export const openMonoListPanelTabAtomAction = atom(null, (get, set, tab: MonoListPanelTab) => {
  const tabs = get(monoListPanelTabsAtom)
  const nextTabs = tabs.some((item) => item.id === tab.id)
    ? tabs.map((item) => (item.id === tab.id ? tab : item))
    : [...tabs, tab]

  set(monoListPanelTabsAtom, nextTabs)
  set(monoListPanelActiveTabIdAtom, tab.id)
  set(leftPanelOpenContentAtom, 'monoList')
  set(leftPanelOpenAtom, true)
})

export const closeMonoListPanelTabAtomAction = atom(null, (get, set, id: string) => {
  const tabs = get(monoListPanelTabsAtom)
  const activeTabId = get(monoListPanelActiveTabIdAtom)
  const index = tabs.findIndex((item) => item.id === id)
  const nextTabs = tabs.filter((item) => item.id !== id)

  set(monoListPanelTabsAtom, nextTabs)

  if (activeTabId === id) {
    const nextActiveTab = nextTabs[Math.max(0, index - 1)] ?? nextTabs[0]
    set(monoListPanelActiveTabIdAtom, nextActiveTab?.id ?? null)
  }

  if (nextTabs.length === 0) {
    set(leftPanelOpenAtom, false)
    set(leftPanelOpenContentAtom, 'collection')
  }
})

export const closeAllMonoListPanelTabsAtomAction = atom(null, (_get, set) => {
  set(monoListPanelTabsAtom, [])
  set(monoListPanelActiveTabIdAtom, null)
  set(leftPanelOpenAtom, false)
  set(leftPanelOpenContentAtom, 'collection')
})

export const restoreMonoListPanelAtomAction = atom(
  (get) => ({
    hasTabs: get(monoListPanelTabsAtom).length > 0,
    isOpen: get(leftPanelOpenAtom) && get(leftPanelOpenContentAtom) === 'monoList',
  }),
  (get, set) => {
    if (get(monoListPanelTabsAtom).length === 0) return

    if (get(leftPanelOpenAtom) && get(leftPanelOpenContentAtom) === 'monoList') {
      set(leftPanelOpenAtom, false)
      return
    }

    set(leftPanelOpenContentAtom, 'monoList')
    set(leftPanelOpenAtom, true)
  },
)

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
