import { MyLink } from '@renderer/components/my-link'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import {
  MonoRelatedListPanelContent,
  MonoSubjectListPanelContent,
} from './mono-list-panel/mono-content'
import { SearchMonosListPanelContent } from './mono-list-panel/search-mono-content'
import { SearchSubjectsListPanelContent } from './mono-list-panel/search-content'
import {
  SubjectCharacterListPanelContent,
  SubjectEpisodeListPanelContent,
  SubjectRelatedListPanelContent,
  SubjectTankobonListPanelContent,
} from './mono-list-panel/subject-content'
import { UserCollectionsListPanelContent } from './mono-list-panel/user-collections-content'
import type { MonoListPanelTab } from '@renderer/state/panel'
import {
  closeAllMonoListPanelTabsAtomAction,
  closeMonoListPanelTabAtomAction,
  monoListPanelActiveTabIdAtom,
  monoListPanelCenterActiveItemAtom,
  monoListPanelTabsAtom,
} from '@renderer/state/panel'
import { isRoutePathActive } from './mono-list-panel/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function MonoListPanel() {
  const tabs = useAtomValue(monoListPanelTabsAtom)
  const [activeTabId, setActiveTabId] = useAtom(monoListPanelActiveTabIdAtom)
  const closeTab = useSetAtom(closeMonoListPanelTabAtomAction)
  const closeAllTabs = useSetAtom(closeAllMonoListPanelTabsAtomAction)
  const [centerActiveItem, setCenterActiveItem] = useAtom(monoListPanelCenterActiveItemAtom)
  const { pathname } = useLocation()
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const activeTabCount = activeTab ? getMonoListPanelTabCount(activeTab) : null
  const activeTabSourceTo = activeTab ? getMonoListPanelTabSourceTo(activeTab) : null
  const activeTabSourceActive = activeTabSourceTo
    ? isRoutePathActive(pathname, activeTabSourceTo)
    : false
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    if (!activeTabId && activeTab) setActiveTabId(activeTab.id)
  }, [activeTab, activeTabId, setActiveTabId])

  useEffect(() => {
    if (!activeTab) return
    tabRefs.current.get(activeTab.id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [activeTab])

  if (!activeTab) return null

  return (
    <div className="flex h-dvh min-w-0 flex-col">
      <div className="drag-region flex h-14 shrink-0 flex-col justify-center border-b px-2">
        <div className="flex flex-row items-center gap-1">
          <div className="flex min-w-0 flex-1 flex-row gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                className="no-drag-region hover:bg-accent data-[active=true]:bg-accent flex max-w-40 min-w-16 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                data-active={tab.id === activeTab.id}
                key={tab.id}
                title={`${tab.title} - ${tab.sourceTitle}`}
                ref={(element) => {
                  if (element) tabRefs.current.set(tab.id, element)
                  else tabRefs.current.delete(tab.id)
                }}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="line-clamp-1 min-w-0">{tab.title}</span>
                <span
                  className="text-muted-foreground hover:text-foreground flex shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  <XIcon className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
          <button
            className="text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
            onClick={() => closeAllTabs()}
            title="关闭全部"
          >
            <span className="i-mingcute-close-circle-line text-base" />
          </button>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 border-b px-3 py-2">
        <div className="flex min-w-0 flex-row items-center justify-between gap-2">
          <div className="line-clamp-1 min-w-0 text-sm font-medium">
            {activeTab.title}
            {activeTabCount !== null && (
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                {activeTabCount}
              </span>
            )}
          </div>
          <Label className="text-muted-foreground no-drag-region shrink-0 gap-1.5 text-xs font-normal">
            <Switch
              checked={centerActiveItem}
              onCheckedChange={setCenterActiveItem}
              className="scale-90"
            />
            居中
          </Label>
        </div>
        <div className="text-muted-foreground line-clamp-1 text-xs">
          来自{' '}
          {activeTabSourceTo ? (
            <MyLink
              className="group/source text-primary focus-visible:ring-ring/50 -mx-1 rounded-sm px-1 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
              to={activeTabSourceTo}
              onClick={(event) => {
                if (activeTabSourceActive) event.preventDefault()
              }}
            >
              <span className="group-hover/source:bg-primary/10 rounded-sm">
                {activeTab.sourceTitle}
              </span>
            </MyLink>
          ) : (
            activeTab.sourceTitle
          )}
        </div>
      </div>
      <MonoListPanelContent tab={activeTab} />
    </div>
  )
}

function MonoListPanelContent({ tab }: { tab: MonoListPanelTab }) {
  if (tab.type === 'subjects') return <MonoSubjectListPanelContent tab={tab} />
  if (tab.type === 'related') return <MonoRelatedListPanelContent tab={tab} />
  if (tab.type === 'subjectCharacters') return <SubjectCharacterListPanelContent tab={tab} />
  if (tab.type === 'subjectRelated') return <SubjectRelatedListPanelContent tab={tab} />
  if (tab.type === 'subjectTankobon') return <SubjectTankobonListPanelContent tab={tab} />
  if (tab.type === 'subjectEpisodes') return <SubjectEpisodeListPanelContent tab={tab} />
  if (tab.type === 'searchSubjects') return <SearchSubjectsListPanelContent tab={tab} />
  if (tab.type === 'searchMonos') return <SearchMonosListPanelContent tab={tab} />
  return <UserCollectionsListPanelContent tab={tab} />
}

function getMonoListPanelTabCount(tab: MonoListPanelTab) {
  if (tab.type === 'subjects') return tab.subjects.length
  if (tab.type === 'related') return tab.relatedItems.length
  if (tab.type === 'subjectCharacters') return tab.characters.length
  if (tab.type === 'subjectEpisodes') return tab.episodeTotal ?? tab.episodes?.length ?? null
  if (tab.type === 'subjectTankobon') return tab.relatedSubjects.length
  if (tab.type === 'searchSubjects') return null
  if (tab.type === 'searchMonos') return null
  if (tab.type === 'userCollections') return null
  return tab.relatedSubjects.length
}

function getMonoListPanelTabSourceTo(tab: MonoListPanelTab) {
  if (tab.type === 'searchSubjects' || tab.type === 'searchMonos') return tab.sourceTo

  if (tab.type === 'subjects' || tab.type === 'related') {
    return `/${tab.monoType}/${tab.monoId}`
  }

  if (tab.type === 'userCollections') {
    return `/user/${tab.username}`
  }

  return `/subject/${tab.subjectId}`
}
