import { SubjectType } from '@renderer/data/types/subject'
import type { Character } from '@renderer/data/types/character'
import type { SubjectId } from '@renderer/data/types/bgm'
import type { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import type { Episode } from '@renderer/data/types/episode'
import type { RelatedSubject } from '@renderer/data/types/subject'
import type { MonoRelatedItem, MonoSubjectItem, MonoType } from '@renderer/data/types/mono'
import type { SearchParam } from '@renderer/data/types/search'
import type {
  CommunityTopic,
  CommunityTopicKind,
  GroupSort,
  SlimGroup,
  SubjectTopicSource,
} from '@renderer/data/types/community'
import type { TimelineMode } from '@renderer/data/types/timeline'
import type { SectionPath } from '@renderer/data/types/web'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type LeftPanelName = 'collection' | 'monoList'

export type RightPanelName = 'subjectInfo'

export type RightPanelContent = 'searchFilter' | 'subjectInfo' | 'userTimeline'

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
  | {
      id: string
      type: 'subjectTankobon'
      title: string
      sourceTitle: string
      subjectId: string
      relatedSubjects: RelatedSubject[]
    }
  | {
      id: string
      type: 'subjectEpisodes'
      title: string
      sourceTitle: string
      subjectId: string
      episodes?: Episode[] | CollectionEpisode[]
      episodeTotal?: number
      initialOffset?: number
    }
  | {
      id: string
      type: 'userCollections'
      title: string
      sourceTitle: string
      username: string
      subjectType: SubjectType
      collectionType: CollectionType
    }
  | {
      id: string
      type: 'searchSubjects'
      title: string
      sourceTitle: string
      searchParam: SearchParam
      sourceTo?: string
    }
  | {
      id: string
      type: 'searchMonos'
      title: string
      sourceTitle: string
      searchParam: SearchParam
      sourceTo?: string
    }
  | {
      id: string
      type: 'communityTopics'
      title: string
      panelTitle: string
      sourceTitle: string
      sourceTo: string
      groupMode?: 'all' | 'joined' | 'created' | 'replied'
      topicKind: CommunityTopicKind
      topics: CommunityTopic[]
    }
  | {
      id: string
      type: 'communityGroupTopics'
      title: string
      panelTitle: string
      sourceTitle: string
      sourceTo: string
      groupName: string
      group?: SlimGroup | null
      topics: CommunityTopic[]
    }
  | {
      id: string
      type: 'communitySubjectTopics'
      title: string
      panelTitle: string
      sourceTitle: string
      sourceTo: string
      subjectId: SubjectId
      subject?: SubjectTopicSource | null
      topics: CommunityTopic[]
    }
  | {
      id: string
      type: 'communityGroups'
      title: string
      panelTitle: string
      sourceTitle: string
      sourceTo: string
      groups: SlimGroup[]
      listKind: 'all' | 'user'
      sort?: GroupSort
      username?: string
    }
  | {
      id: string
      type: 'siteTimeline'
      title: string
      panelTitle: string
      sourceTitle: string
      sourceTo: string
      mode: TimelineMode
    }
  | {
      id: string
      type: 'trendingSubjects'
      title: string
      panelTitle: string
      sourceTitle: string
      sourceTo: string
      sectionPath: SectionPath
    }

export const navOpenAtom = atom(false)

export const leftPanelOpenAtom = atom(false)

export const rightPanelOpenAtom = atom(false)

export const leftPanelOpenContentAtom = atom<LeftPanelName>('collection')

export const leftPanelWidth = atomWithStorage('app-sidebar-width', 248)

export const rightPanelWidth = atomWithStorage('app-right-panel-width', 248)

export function getRightPanelContentByPathname(pathname: string): RightPanelContent | null {
  if (pathname.includes('profile') || pathname.includes('user')) return 'userTimeline'
  if (pathname.includes('subject')) return 'subjectInfo'
  if (pathname.includes('search')) return 'searchFilter'
  return null
}

const LEFT_PANEL_CLOSE_ANIMATION_MS = 350

// export const rightPanelOpenContentAtom = atom<RightPanelName | null>(null)

// left

export const collectionPanelSubjectTypeAtom = atom<keyof typeof SubjectType>('anime')

export const collectionPanelUsernameAtom = atom<string | undefined>(undefined)

export const monoListPanelTabsAtom = atom<MonoListPanelTab[]>([])

export const monoListPanelActiveTabIdAtom = atom<string | null>(null)

export type MonoListPanelRefreshAction = {
  disabled?: boolean
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
  tabId: string
}

export const monoListPanelRefreshActionAtom = atom<MonoListPanelRefreshAction | null>(null)

export const monoListPanelCenterActiveItemAtom = atomWithStorage(
  'mono-list-panel-center-active-item',
  false,
)

export const homeSiteTimelineModeAtom = atomWithStorage<TimelineMode>(
  'home-site-timeline-mode',
  'all',
)

export const monoListSiteTimelineModeAtom = atomWithStorage<TimelineMode>(
  'mono-list-site-timeline-mode',
  'all',
)

// action
export const nvaCollectionButtonAtomAction = atom(
  (get) => ({
    openState: get(leftPanelOpenAtom),
    openContent: get(leftPanelOpenContentAtom),
    subjectType: get(collectionPanelSubjectTypeAtom),
    username: get(collectionPanelUsernameAtom),
  }),
  (_get, set, subjectType: keyof typeof SubjectType, open: boolean, username?: string) => {
    if (!open) {
      set(leftPanelOpenAtom, false)
      set(collectionPanelUsernameAtom, undefined)
    } else {
      set(leftPanelOpenAtom, true)
      set(leftPanelOpenContentAtom, 'collection')
      set(collectionPanelSubjectTypeAtom, subjectType)
      set(collectionPanelUsernameAtom, username)
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

  if (tab.type === 'siteTimeline') {
    set(monoListSiteTimelineModeAtom, tab.mode)
  }

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
    window.setTimeout(() => {
      if (get(leftPanelOpenAtom) || get(leftPanelOpenContentAtom) !== 'monoList') return
      if (get(monoListPanelTabsAtom).length > 0) return
      set(leftPanelOpenContentAtom, 'collection')
    }, LEFT_PANEL_CLOSE_ANIMATION_MS)
  }
})

export const closeAllMonoListPanelTabsAtomAction = atom(null, (get, set) => {
  if (get(monoListPanelTabsAtom).length === 0) return

  set(monoListPanelTabsAtom, [])
  set(monoListPanelActiveTabIdAtom, null)
  set(leftPanelOpenAtom, false)
  window.setTimeout(() => {
    if (get(leftPanelOpenAtom) || get(leftPanelOpenContentAtom) !== 'monoList') return
    if (get(monoListPanelTabsAtom).length > 0) return
    set(leftPanelOpenContentAtom, 'collection')
  }, LEFT_PANEL_CLOSE_ANIMATION_MS)
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
