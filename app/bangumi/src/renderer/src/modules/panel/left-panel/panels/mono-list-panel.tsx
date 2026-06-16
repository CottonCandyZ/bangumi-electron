import { ScrollArea } from '@base-ui/react/scroll-area'
import { MyLink } from '@renderer/components/my-link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { cn } from '@renderer/lib/utils'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import {
  MonoRelatedListPanelContent,
  MonoSubjectListPanelContent,
} from './mono-list-panel/mono-content'
import { SearchMonosListPanelContent } from './mono-list-panel/search-mono-content'
import { SearchSubjectsListPanelContent } from './mono-list-panel/search-content'
import {
  CommunityGroupsListPanelContent,
  CommunityGroupTopicsListPanelContent,
  CommunitySubjectTopicsListPanelContent,
  CommunityTopicsListPanelContent,
} from './mono-list-panel/community-content'
import {
  SubjectCharacterListPanelContent,
  SubjectEpisodeListPanelContent,
  SubjectRelatedListPanelContent,
  SubjectTankobonListPanelContent,
} from './mono-list-panel/subject-content'
import { SubjectRecommendationsListPanelContent } from './mono-list-panel/subject-recommendation-content'
import {
  IndexRelatedListPanelContent,
  MonoIndexesListPanelContent,
} from './mono-list-panel/index-content'
import { SiteTimelineListPanelContent } from './mono-list-panel/site-timeline-content'
import { TrendingSubjectsListPanelContent } from './mono-list-panel/trending-subjects-content'
import { UserCollectionsListPanelContent } from './mono-list-panel/user-collections-content'
import type { MonoListPanelTab } from '@renderer/state/panel'
import {
  closeAllMonoListPanelTabsAtomAction,
  closeMonoListPanelTabAtomAction,
  monoListPanelActiveTabIdAtom,
  monoListPanelCenterActiveItemAtom,
  monoListPanelRefreshActionAtom,
  monoListPanelTabsAtom,
} from '@renderer/state/panel'
import { isRoutePathActive } from './mono-list-panel/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { ChevronsDownIcon, XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useLocation } from 'react-router-dom'

export function MonoListPanel() {
  const tabs = useAtomValue(monoListPanelTabsAtom)
  const [activeTabId, setActiveTabId] = useAtom(monoListPanelActiveTabIdAtom)
  const closeTab = useSetAtom(closeMonoListPanelTabAtomAction)
  const closeAllTabs = useSetAtom(closeAllMonoListPanelTabsAtomAction)
  const [centerActiveItem, setCenterActiveItem] = useAtom(monoListPanelCenterActiveItemAtom)
  const refreshAction = useAtomValue(monoListPanelRefreshActionAtom)
  const { pathname, search } = useLocation()
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const activeTabCount = activeTab ? getMonoListPanelTabCount(activeTab) : null
  const activeTabTitle = activeTab ? getMonoListPanelTabDisplayTitle(activeTab) : ''
  const activeTabSourceTo = activeTab ? getMonoListPanelTabSourceTo(activeTab) : null
  const activeRefreshAction =
    activeTab && refreshAction?.tabId === activeTab.id ? refreshAction : null
  const activeTabSourceActive = activeTabSourceTo
    ? isRoutePathActive(`${pathname}${search}`, activeTabSourceTo)
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
      inline: 'center',
    })
  }, [activeTab])

  if (!activeTab) return null

  return (
    <div className="flex h-dvh min-w-0 flex-col">
      <div className="drag-region flex h-14 shrink-0 flex-col justify-center border-b px-2">
        <div className="flex flex-row items-center gap-1">
          <MonoListPanelTabStrip
            activeTabId={activeTab.id}
            closeTab={closeTab}
            setActiveTabId={setActiveTabId}
            tabRefs={tabRefs}
            tabs={tabs}
          />
          <div className="flex shrink-0 flex-row items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
                  title="标签页列表"
                >
                  <ChevronsDownIcon className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 w-56">
                {tabs.map((tab) => (
                  <DropdownMenuItem
                    className={cn(
                      'min-w-0 justify-between gap-2 pr-1',
                      tab.id === activeTab.id && 'bg-accent text-accent-foreground',
                    )}
                    key={tab.id}
                    onSelect={() => setActiveTabId(tab.id)}
                  >
                    <span className="line-clamp-1 min-w-0">{tab.title}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1">
                      <span className="text-muted-foreground text-xs">
                        {getMonoListPanelTabCount(tab) ?? ''}
                      </span>
                      <span
                        className="text-muted-foreground hover:bg-accent-foreground/10 hover:text-foreground flex size-5 items-center justify-center rounded-sm"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          closeTab(tab.id)
                        }}
                      >
                        <XIcon className="size-3.5" />
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              className="text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
              onClick={() => closeAllTabs()}
              title="关闭全部"
            >
              <span className="i-mingcute-close-circle-line text-base" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 border-b px-3 py-2">
        <div className="flex min-w-0 flex-row items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <div className="line-clamp-1 min-w-0 text-sm font-medium">
              {activeTabTitle}
              {activeTabCount !== null && (
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  {activeTabCount}
                </span>
              )}
            </div>
            {activeRefreshAction && (
              <QueryRefreshButton
                className="size-7"
                disabled={activeRefreshAction.disabled}
                onRefresh={activeRefreshAction.onRefresh}
                refreshing={activeRefreshAction.refreshing}
              />
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

function MonoListPanelTabStrip({
  activeTabId,
  closeTab,
  setActiveTabId,
  tabRefs,
  tabs,
}: {
  activeTabId: string
  closeTab: (id: string) => void
  setActiveTabId: (id: string) => void
  tabRefs: MutableRefObject<Map<string, HTMLButtonElement>>
  tabs: MonoListPanelTab[]
}) {
  return (
    <ScrollArea.Root className="group/tab-scroll relative h-11 min-w-0 flex-1 overflow-hidden">
      <ScrollArea.Viewport
        className="h-full w-full overflow-y-hidden focus-visible:outline-hidden"
        onWheel={(event) => {
          const viewport = event.currentTarget
          const hasHorizontalOverflow = viewport.scrollWidth > viewport.clientWidth
          const isPrimarilyVerticalWheel = Math.abs(event.deltaY) > Math.abs(event.deltaX)

          if (!hasHorizontalOverflow || !isPrimarilyVerticalWheel) return

          event.preventDefault()
          viewport.scrollLeft += getWheelPixelDelta(
            event.deltaY,
            event.deltaMode,
            viewport.clientWidth,
          )
        }}
      >
        <ScrollArea.Content className="flex h-full w-max min-w-full flex-row items-center gap-1">
          {tabs.map((tab) => (
            <button
              className="no-drag-region hover:bg-accent data-[active=true]:bg-accent flex h-9 max-w-40 min-w-16 items-center justify-between gap-2 rounded-md px-2 text-left text-sm"
              data-active={tab.id === activeTabId}
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
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="horizontal"
        className="no-drag-region absolute right-1 bottom-0 left-1 z-20 flex h-1 touch-none opacity-0 transition-opacity duration-150 select-none group-hover/tab-scroll:opacity-100 data-[scrolling]:opacity-100"
      >
        <ScrollArea.Thumb className="no-drag-region bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative h-full [width:var(--scroll-area-thumb-width)] shrink-0 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

function getWheelPixelDelta(delta: number, deltaMode: number, pageSize: number) {
  if (deltaMode === 1) return delta * 16
  if (deltaMode === 2) return delta * pageSize
  return delta
}

function MonoListPanelContent({ tab }: { tab: MonoListPanelTab }) {
  if (tab.type === 'subjects') return <MonoSubjectListPanelContent tab={tab} />
  if (tab.type === 'related') return <MonoRelatedListPanelContent tab={tab} />
  if (tab.type === 'subjectCharacters') return <SubjectCharacterListPanelContent tab={tab} />
  if (tab.type === 'subjectRelated') return <SubjectRelatedListPanelContent tab={tab} />
  if (tab.type === 'subjectTankobon') return <SubjectTankobonListPanelContent tab={tab} />
  if (tab.type === 'subjectEpisodes') return <SubjectEpisodeListPanelContent tab={tab} />
  if (tab.type === 'monoIndexes') return <MonoIndexesListPanelContent tab={tab} />
  if (tab.type === 'indexRelated') return <IndexRelatedListPanelContent tab={tab} />
  if (tab.type === 'subjectRecommendations') {
    return <SubjectRecommendationsListPanelContent tab={tab} />
  }
  if (tab.type === 'searchSubjects') return <SearchSubjectsListPanelContent tab={tab} />
  if (tab.type === 'searchMonos') return <SearchMonosListPanelContent tab={tab} />
  if (tab.type === 'communityTopics') return <CommunityTopicsListPanelContent tab={tab} />
  if (tab.type === 'communityGroupTopics') return <CommunityGroupTopicsListPanelContent tab={tab} />
  if (tab.type === 'communitySubjectTopics') {
    return <CommunitySubjectTopicsListPanelContent tab={tab} />
  }
  if (tab.type === 'communityGroups') return <CommunityGroupsListPanelContent tab={tab} />
  if (tab.type === 'siteTimeline') return <SiteTimelineListPanelContent tab={tab} />
  if (tab.type === 'trendingSubjects') return <TrendingSubjectsListPanelContent tab={tab} />
  return <UserCollectionsListPanelContent tab={tab} />
}

function getMonoListPanelTabCount(tab: MonoListPanelTab) {
  if (tab.type === 'subjects') return tab.subjects.length
  if (tab.type === 'related') return tab.relatedItems.length
  if (tab.type === 'subjectCharacters') return tab.characters.length
  if (tab.type === 'subjectEpisodes') return tab.episodeTotal ?? tab.episodes?.length ?? null
  if (tab.type === 'monoIndexes') return null
  if (tab.type === 'indexRelated') return null
  if (tab.type === 'subjectRecommendations') return null
  if (tab.type === 'subjectTankobon') return tab.relatedSubjects.length
  if (tab.type === 'searchSubjects') return null
  if (tab.type === 'searchMonos') return null
  if (tab.type === 'communityTopics') return tab.topics.length
  if (tab.type === 'communityGroupTopics') return tab.group?.topics ?? null
  if (tab.type === 'communitySubjectTopics') return null
  if (tab.type === 'communityGroups') return tab.groups.length
  if (tab.type === 'siteTimeline') return null
  if (tab.type === 'trendingSubjects') return null
  if (tab.type === 'userCollections') return null
  return tab.relatedSubjects.length
}

function getMonoListPanelTabDisplayTitle(tab: MonoListPanelTab) {
  if (
    tab.type === 'communityTopics' ||
    tab.type === 'communityGroupTopics' ||
    tab.type === 'communitySubjectTopics' ||
    tab.type === 'communityGroups' ||
    tab.type === 'siteTimeline' ||
    tab.type === 'trendingSubjects' ||
    tab.type === 'monoIndexes' ||
    tab.type === 'indexRelated' ||
    tab.type === 'subjectRecommendations'
  ) {
    return tab.panelTitle
  }
  return tab.title
}

function getMonoListPanelTabSourceTo(tab: MonoListPanelTab) {
  if (tab.type === 'searchSubjects' || tab.type === 'searchMonos') return tab.sourceTo
  if (tab.type === 'communityTopics') return tab.sourceTo
  if (tab.type === 'communityGroupTopics') return tab.sourceTo
  if (tab.type === 'communitySubjectTopics') return tab.sourceTo
  if (tab.type === 'communityGroups') return tab.sourceTo
  if (tab.type === 'siteTimeline') return tab.sourceTo
  if (tab.type === 'trendingSubjects') return tab.sourceTo
  if (tab.type === 'monoIndexes') return tab.sourceTo
  if (tab.type === 'indexRelated') return tab.sourceTo
  if (tab.type === 'subjectRecommendations') return tab.sourceTo

  if (tab.type === 'subjects' || tab.type === 'related') {
    return `/${tab.monoType}/${tab.monoId}`
  }

  if (tab.type === 'userCollections') {
    return `/user/${tab.username}`
  }

  return `/subject/${tab.subjectId}`
}
