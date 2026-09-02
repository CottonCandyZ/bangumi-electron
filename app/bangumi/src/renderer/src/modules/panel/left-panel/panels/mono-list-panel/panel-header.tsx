import { MyLink } from '@renderer/components/my-link'
import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
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
import type { MonoListPanelTab } from '@renderer/state/panel'
import {
  monoListPanelCenterActiveItemAtom,
  monoListPanelRefreshActionAtom,
} from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { ChevronsDownIcon, ListFilterIcon, XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { isRoutePathActive } from './shared'

type MonoListPanelHeaderProps = {
  activeTab: MonoListPanelTab
  canToggleFilters: boolean
  closeAllTabs: () => void
  closeTab: (id: string) => void
  filtersOpen: boolean
  setActiveTabId: (id: string) => void
  tabs: MonoListPanelTab[]
  toggleFilters: () => void
}

export function MonoListPanelHeader({
  activeTab,
  canToggleFilters,
  closeAllTabs,
  closeTab,
  filtersOpen,
  setActiveTabId,
  tabs,
  toggleFilters,
}: MonoListPanelHeaderProps) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    tabRefs.current.get(activeTab.id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeTab.id])

  return (
    <>
      <div className="drag-region flex h-14 shrink-0 flex-col justify-center border-b px-2">
        <div className="flex flex-row items-center gap-1">
          <MonoListPanelTabStrip
            activeTabId={activeTab.id}
            closeTab={closeTab}
            setActiveTabId={setActiveTabId}
            tabRefs={tabRefs}
            tabs={tabs}
          />
          <MonoListPanelTabActions
            activeTabId={activeTab.id}
            closeAllTabs={closeAllTabs}
            closeTab={closeTab}
            setActiveTabId={setActiveTabId}
            tabs={tabs}
          />
        </div>
      </div>
      <MonoListPanelMeta
        activeTab={activeTab}
        canToggleFilters={canToggleFilters}
        filtersOpen={filtersOpen}
        toggleFilters={toggleFilters}
      />
    </>
  )
}

function MonoListPanelTabActions({
  activeTabId,
  closeAllTabs,
  closeTab,
  setActiveTabId,
  tabs,
}: {
  activeTabId: string
  closeAllTabs: () => void
  closeTab: (id: string) => void
  setActiveTabId: (id: string) => void
  tabs: MonoListPanelTab[]
}) {
  return (
    <div className="flex shrink-0 flex-row items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="标签页列表"
            className="text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
            title="标签页列表"
          >
            <ChevronsDownIcon className="size-4.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 w-56">
          {tabs.map((tab) => (
            <DropdownMenuItem
              className={cn(
                'min-w-0 justify-between gap-2 pr-1',
                tab.id === activeTabId && 'bg-accent text-accent-foreground',
              )}
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
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
        aria-label="关闭全部"
        className="text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
        onClick={closeAllTabs}
        title="关闭全部"
      >
        <span className="i-mingcute-close-circle-line text-lg" />
      </button>
    </div>
  )
}

function MonoListPanelMeta({
  activeTab,
  canToggleFilters,
  filtersOpen,
  toggleFilters,
}: {
  activeTab: MonoListPanelTab
  canToggleFilters: boolean
  filtersOpen: boolean
  toggleFilters: () => void
}) {
  const [centerActiveItem, setCenterActiveItem] = useAtom(monoListPanelCenterActiveItemAtom)
  const refreshAction = useAtomValue(monoListPanelRefreshActionAtom)
  const { pathname, search } = useLocation()
  const count = getMonoListPanelTabCount(activeTab)
  const sourceTo = getMonoListPanelTabSourceTo(activeTab)
  const sourceActive = sourceTo ? isRoutePathActive(`${pathname}${search}`, sourceTo) : false
  const activeRefreshAction = refreshAction?.tabId === activeTab.id ? refreshAction : null

  return (
    <div className="flex shrink-0 flex-col gap-0.5 border-b px-3 py-2">
      <div className="flex min-w-0 flex-row items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <div className="line-clamp-1 min-w-0 text-sm font-medium">
            {getMonoListPanelTabDisplayTitle(activeTab)}
            {count !== null && (
              <span className="text-muted-foreground ml-1 text-xs font-normal">{count}</span>
            )}
          </div>
          {activeRefreshAction && (
            <QueryRefreshButton
              className="text-muted-foreground hover:text-foreground size-6 [&>span]:text-sm"
              disabled={activeRefreshAction.disabled}
              onRefresh={activeRefreshAction.onRefresh}
              refreshing={activeRefreshAction.refreshing}
            />
          )}
          {canToggleFilters && (
            <MonoListPanelFilterButton filtersOpen={filtersOpen} onToggle={toggleFilters} />
          )}
        </div>
        <Label className="text-muted-foreground no-drag-region shrink-0 gap-1.5 text-xs font-normal">
          <Switch
            checked={centerActiveItem}
            className="scale-90"
            onCheckedChange={setCenterActiveItem}
          />
          居中
        </Label>
      </div>
      <div className="text-muted-foreground line-clamp-1 text-xs">
        来自{' '}
        {sourceTo ? (
          <MyLink
            className="group/source text-primary focus-visible:ring-ring/50 -mx-1 rounded-sm px-1 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
            onClick={(event) => {
              if (sourceActive) event.preventDefault()
            }}
            to={sourceTo}
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
  )
}

function MonoListPanelFilterButton({
  filtersOpen,
  onToggle,
}: {
  filtersOpen: boolean
  onToggle: () => void
}) {
  const label = filtersOpen ? '收起筛选' : '展开筛选'

  return (
    <HeaderButton
      Button={
        <button
          aria-label={label}
          aria-pressed={filtersOpen}
          className={cn(
            'text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md',
            filtersOpen && 'bg-accent text-foreground',
          )}
          onClick={onToggle}
        >
          <ListFilterIcon className="size-3.5" />
        </button>
      }
      Content={<p>{label}</p>}
    />
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
    <div className="relative h-11 min-w-0 flex-1 overflow-hidden">
      <div
        className="h-full w-full overflow-x-auto overflow-y-hidden focus-visible:outline-hidden"
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
        <div className="flex h-full w-max min-w-full flex-row items-center gap-1">
          {tabs.map((tab) => (
            <button
              className="no-drag-region hover:bg-accent data-[active=true]:bg-accent flex h-9 max-w-40 min-w-16 items-center justify-between gap-2 rounded-md px-2 text-left text-sm"
              data-active={tab.id === activeTabId}
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              ref={(element) => {
                if (element) tabRefs.current.set(tab.id, element)
                else tabRefs.current.delete(tab.id)
              }}
              title={`${tab.title} - ${tab.sourceTitle}`}
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
      </div>
    </div>
  )
}

function getWheelPixelDelta(delta: number, deltaMode: number, pageSize: number) {
  if (deltaMode === 1) return delta * 16
  if (deltaMode === 2) return delta * pageSize
  return delta
}

function getMonoListPanelTabCount(tab: MonoListPanelTab) {
  if (tab.type === 'subjects') return tab.subjects.length
  if (tab.type === 'related') return tab.relatedItems.length
  if (tab.type === 'subjectCharacters') return tab.characters.length
  if (tab.type === 'subjectEpisodes') return tab.episodeTotal ?? tab.episodes?.length ?? null
  if (tab.type === 'monoIndexes') return null
  if (tab.type === 'indexRelated') return null
  if (tab.type === 'subjectRecommendations') return null
  if (tab.type === 'subjectReviews') return tab.total
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
  if (tab.type === 'userFriends') return tab.total
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
    tab.type === 'subjectRecommendations' ||
    tab.type === 'subjectReviews' ||
    tab.type === 'userFriends'
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
  if (tab.type === 'subjectReviews') return tab.sourceTo
  if (tab.type === 'userFriends') return tab.sourceTo

  if (tab.type === 'subjects' || tab.type === 'related') {
    return `/${tab.monoType}/${tab.monoId}`
  }

  if (tab.type === 'userCollections') return `/user/${tab.username}`

  return `/subject/${tab.subjectId}`
}
