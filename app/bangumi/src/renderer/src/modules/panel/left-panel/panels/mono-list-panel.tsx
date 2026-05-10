import { MasonryInfiniteGrid } from '@egjs/react-infinitegrid'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { BackToTopButton } from '@renderer/components/button/back-to-top'
import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tabs } from '@renderer/components/tabs'
import { useCollectionEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/collection'
import { useEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/episodes'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionEpisode } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { SubjectType } from '@renderer/data/types/subject'
import type { MonoRelatedItem } from '@renderer/data/types/mono'
import { PageSelector } from '@renderer/modules/common/episodes/grid/page-selector'
import type { MonoListPanelTab } from '@renderer/state/panel'
import {
  closeAllMonoListPanelTabsAtomAction,
  closeMonoListPanelTabAtomAction,
  monoListPanelActiveTabIdAtom,
  monoListPanelTabsAtom,
} from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { XIcon } from 'lucide-react'
import { Children, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren, ReactNode, UIEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const SUBJECT_TYPE_MAP: Record<SubjectType, string> = {
  [SubjectType.book]: '书籍',
  [SubjectType.anime]: '动画',
  [SubjectType.music]: '音乐',
  [SubjectType.game]: '游戏',
  [SubjectType.real]: '三次元',
}

const ALL_SUBJECT_TYPES = '全部类型'
const ALL_SUBJECT_RELATIONS = '全部职能'
const ALL_RELATED_TYPES = '全部类型'
const PANEL_ITEM_CLASS =
  'hover:bg-accent data-[active=true]:bg-accent flex min-h-20 cursor-pointer flex-row gap-3 rounded-md p-2'

export function MonoListPanel() {
  const tabs = useAtomValue(monoListPanelTabsAtom)
  const [activeTabId, setActiveTabId] = useAtom(monoListPanelActiveTabIdAtom)
  const closeTab = useSetAtom(closeMonoListPanelTabAtomAction)
  const closeAllTabs = useSetAtom(closeAllMonoListPanelTabsAtomAction)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const activeTabCount = activeTab ? getMonoListPanelTabCount(activeTab) : null
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
        <div className="no-drag-region flex flex-row items-center gap-1">
          <div className="flex min-w-0 flex-1 flex-row gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                className="hover:bg-accent data-[active=true]:bg-accent flex max-w-40 min-w-16 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm"
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
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
            onClick={() => closeAllTabs()}
            title="关闭全部"
          >
            <span className="i-mingcute-close-circle-line text-base" />
          </button>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 border-b px-3 py-2">
        <div className="line-clamp-1 text-sm font-medium">
          {activeTab.title}
          {activeTabCount !== null && (
            <span className="text-muted-foreground ml-1 text-xs font-normal">{activeTabCount}</span>
          )}
        </div>
        <div className="text-muted-foreground line-clamp-1 text-xs">
          来自 {activeTab.sourceTitle}
        </div>
      </div>
      {activeTab.type === 'subjects' ? (
        <MonoSubjectListPanelContent tab={activeTab} />
      ) : activeTab.type === 'related' ? (
        <MonoRelatedListPanelContent tab={activeTab} />
      ) : activeTab.type === 'subjectCharacters' ? (
        <SubjectCharacterListPanelContent tab={activeTab} />
      ) : activeTab.type === 'subjectRelated' ? (
        <SubjectRelatedListPanelContent tab={activeTab} />
      ) : activeTab.type === 'subjectTankobon' ? (
        <SubjectTankobonListPanelContent tab={activeTab} />
      ) : (
        <SubjectEpisodeListPanelContent tab={activeTab} />
      )}
    </div>
  )
}

function getMonoListPanelTabCount(tab: MonoListPanelTab) {
  if (tab.type === 'subjects') return tab.subjects.length
  if (tab.type === 'related') return tab.relatedItems.length
  if (tab.type === 'subjectCharacters') return tab.characters.length
  if (tab.type === 'subjectEpisodes') return tab.episodeTotal ?? tab.episodes?.length ?? null
  if (tab.type === 'subjectTankobon') return tab.relatedSubjects.length
  return tab.relatedSubjects.length
}

function MonoSubjectListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjects' }>
}) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const typeFilterId = `${tab.id}-panel-type`
  const relationFilterId = `${tab.id}-panel-relation`
  const typeFilter = filterMap.get(typeFilterId) ?? ALL_SUBJECT_TYPES
  const relationFilter = filterMap.get(relationFilterId) ?? ALL_SUBJECT_RELATIONS
  const typeFilters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_TYPES,
        ...tab.subjects.map((subject) => SUBJECT_TYPE_MAP[subject.subjectType]),
      ]),
    [tab.subjects],
  )
  const relationFilters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_RELATIONS,
        ...tab.subjects.map((subject) => subject.relation).filter(Boolean),
      ]),
    [tab.subjects],
  )
  const items = useMemo(
    () =>
      tab.subjects.filter((subject) => {
        const matchesType =
          typeFilter === ALL_SUBJECT_TYPES || SUBJECT_TYPE_MAP[subject.subjectType] === typeFilter
        const matchesRelation =
          relationFilter === ALL_SUBJECT_RELATIONS || subject.relation === relationFilter
        return matchesType && matchesRelation
      }),
    [relationFilter, tab.subjects, typeFilter],
  )

  return (
    <>
      <MonoListPanelFilters>
        <PanelFilterTabs
          label="类型"
          currentSelect={typeFilter}
          setCurrentSelect={setFilter}
          tabsContent={typeFilters}
          layoutId={typeFilterId}
        />
        <PanelFilterTabs
          label="职能"
          currentSelect={relationFilter}
          setCurrentSelect={setFilter}
          tabsContent={relationFilters}
          layoutId={relationFilterId}
        />
      </MonoListPanelFilters>
      <MonoPanelInfiniteList>
        {items.map((item) => (
          <div key={`${item.id}-${item.relation}`}>
            <MonoSubjectListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

function MonoRelatedListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'related' }>
}) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filterId = `${tab.id}-panel-type`
  const filter = filterMap.get(filterId) ?? ALL_RELATED_TYPES
  const filters = useMemo(
    () =>
      new Set([
        ALL_RELATED_TYPES,
        ...tab.relatedItems
          .map((item) =>
            item.subjectType === undefined ? undefined : SUBJECT_TYPE_MAP[item.subjectType],
          )
          .filter((item): item is string => item !== undefined),
      ]),
    [tab.relatedItems],
  )
  const items = useMemo(
    () =>
      filter === ALL_RELATED_TYPES
        ? tab.relatedItems
        : tab.relatedItems.filter((item) => {
            if (item.subjectType === undefined) return false
            return SUBJECT_TYPE_MAP[item.subjectType] === filter
          }),
    [filter, tab.relatedItems],
  )

  return (
    <>
      <MonoListPanelFilters>
        <PanelFilterTabs
          label="类型"
          currentSelect={filter}
          setCurrentSelect={setFilter}
          tabsContent={filters}
          layoutId={filterId}
        />
      </MonoListPanelFilters>
      <MonoPanelInfiniteList>
        {items.map((item) => (
          <div key={`${item.id}-${item.subjectId ?? item.relation ?? item.name}`}>
            <MonoRelatedListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

function SubjectCharacterListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectCharacters' }>
}) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filterId = `${tab.id}-panel-relation`
  const filter = filterMap.get(filterId) ?? ALL_SUBJECT_RELATIONS
  const filters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_RELATIONS,
        ...tab.characters.map((character) => character.relation).filter(Boolean),
      ]),
    [tab.characters],
  )
  const items = useMemo(
    () =>
      filter === ALL_SUBJECT_RELATIONS
        ? tab.characters
        : tab.characters.filter((character) => character.relation === filter),
    [filter, tab.characters],
  )

  return (
    <>
      <MonoListPanelFilters>
        <PanelFilterTabs
          label="角色类型"
          currentSelect={filter}
          setCurrentSelect={setFilter}
          tabsContent={filters}
          layoutId={filterId}
        />
      </MonoListPanelFilters>
      <MonoPanelInfiniteList>
        {items.map((item) => (
          <div key={item.id}>
            <SubjectCharacterListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

function SubjectRelatedListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectRelated' }>
}) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filterId = `${tab.id}-panel-relation`
  const filter = filterMap.get(filterId) ?? ALL_SUBJECT_RELATIONS
  const filters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_RELATIONS,
        ...tab.relatedSubjects.map((subject) => subject.relation).filter(Boolean),
      ]),
    [tab.relatedSubjects],
  )
  const items = useMemo(
    () =>
      filter === ALL_SUBJECT_RELATIONS
        ? tab.relatedSubjects
        : tab.relatedSubjects.filter((subject) => subject.relation === filter),
    [filter, tab.relatedSubjects],
  )

  return (
    <>
      <MonoListPanelFilters>
        <PanelFilterTabs
          label="关系"
          currentSelect={filter}
          setCurrentSelect={setFilter}
          tabsContent={filters}
          layoutId={filterId}
        />
      </MonoListPanelFilters>
      <MonoPanelInfiniteList>
        {items.map((item) => (
          <div key={`${item.id}-${item.relation}`}>
            <SubjectRelatedListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

function SubjectEpisodeListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectEpisodes' }>
}) {
  const userInfo = useSession()
  const [offset, setOffset] = useState(tab.initialOffset ?? 0)
  const limit = 100
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId: tab.subjectId,
    offset,
    limit,
    enabled: !userInfo,
  })
  const collectionEpisodesQuery = useCollectionEpisodesInfoBySubjectIdQuery({
    subjectId: tab.subjectId,
    offset,
    limit,
    enabled: !!userInfo,
  })
  const episodeQuery = userInfo ? collectionEpisodesQuery : episodesQuery

  useEffect(() => {
    setOffset(tab.initialOffset ?? 0)
  }, [tab.id, tab.initialOffset])

  if (userInfo === undefined || episodeQuery.data === undefined) {
    return <SubjectEpisodeListPanelSkeleton />
  }

  if (episodeQuery.data.data === null) {
    return <div className="text-muted-foreground p-4 text-sm">暂无章节。</div>
  }

  const hasPagination = episodeQuery.data.total > limit

  return (
    <>
      {hasPagination && (
        <MonoListPanelFilters>
          <PageSelector
            episodes={episodeQuery}
            limit={limit}
            offset={offset}
            setOffSet={setOffset}
          />
        </MonoListPanelFilters>
      )}
      <MonoPanelInfiniteList>
        {episodeQuery.data.data.map((item) => (
          <div key={getPanelEpisode(item).id}>
            <SubjectEpisodeListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

function SubjectTankobonListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectTankobon' }>
}) {
  return (
    <MonoPanelInfiniteList>
      {tab.relatedSubjects.map((item) => (
        <div key={item.id}>
          <SubjectRelatedListItem item={item} />
        </div>
      ))}
    </MonoPanelInfiniteList>
  )
}

function SubjectEpisodeListPanelSkeleton() {
  return (
    <>
      <MonoListPanelFilters>
        <Skeleton className="h-9 w-28" />
      </MonoListPanelFilters>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-md" />
        ))}
      </div>
    </>
  )
}

function MonoListPanelFilters({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col items-start gap-2 border-b px-3 py-3">{children}</div>
  )
}

function PanelFilterTabs({
  label,
  currentSelect,
  setCurrentSelect,
  tabsContent,
  layoutId,
}: {
  label: string
  currentSelect: string
  setCurrentSelect: (id: string, value: string) => void
  tabsContent: Set<string>
  layoutId: string
}) {
  if (tabsContent.size <= 1) return null

  return (
    <div className="flex max-w-full flex-row flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">{label}</span>
      <Tabs
        currentSelect={currentSelect}
        setCurrentSelect={setCurrentSelect}
        tabsContent={tabsContent}
        layoutId={layoutId}
        className="justify-start"
      />
    </div>
  )
}

function MonoPanelInfiniteList({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<HTMLElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)

  if (Children.count(children) === 0) {
    return <div className="text-muted-foreground p-4 text-sm">没有符合条件的项目。</div>
  }

  return (
    <ScrollArea.Root className="group/scroll relative min-h-0 flex-1 overflow-hidden">
      <MasonryInfiniteGrid
        tag={ScrollArea.Viewport as unknown as string}
        container
        containerTag={ScrollArea.Content as unknown as string}
        className="h-full w-full overflow-x-hidden px-2 py-2 focus-visible:outline-hidden"
        useResizeObserver
        observeChildren
        align="stretch"
        maxStretchColumnSize={512}
        gap={4}
        onScroll={(event: UIEvent<HTMLElement>) => {
          const nextViewport = event.currentTarget
          setViewport((prev) => (prev === nextViewport ? prev : nextViewport))
          setScrollTop(nextViewport.scrollTop)
        }}
      >
        {children}
      </MasonryInfiniteGrid>
      <BackToTopButton
        className="absolute right-4 bottom-4"
        scrollTop={scrollTop}
        viewport={viewport}
      />
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

function MonoSubjectListItem({
  item,
}: {
  item: Extract<MonoListPanelTab, { type: 'subjects' }>['subjects'][number]
}) {
  const relatedItems = item.relatedItems ?? []
  const to = `/subject/${item.id}`
  const active = useIsRouteActive(to)

  return (
    <PanelButtonItem active={active} to={to}>
      <PanelItemImage image={item.image} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">{item.nameCn || item.name}</div>
        {item.nameCn && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{item.name}</div>
        )}
        {relatedItems.length > 0 && <RelatedItemLinks className="pt-0.5" items={relatedItems} />}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {SUBJECT_TYPE_MAP[item.subjectType]}
          </Badge>
          {item.relation && (
            <Badge variant="secondary" className="text-xs shadow-none">
              {item.relation}
            </Badge>
          )}
        </div>
      </div>
    </PanelButtonItem>
  )
}

function RelatedItemLinks({ className, items }: { className?: string; items: MonoRelatedItem[] }) {
  const { pathname } = useLocation()
  const hasActiveItem = items.some((item) => isRoutePathActive(pathname, item.link))
  const ref = useActivePanelItemRef(hasActiveItem)

  return (
    <div
      className={`flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-0.5 text-xs ${className ?? ''}`}
      ref={ref}
    >
      {items.map((item) => {
        const active = isRoutePathActive(pathname, item.link)

        return (
          <MyLink
            className="text-primary hover:bg-primary/10 focus-visible:ring-ring/50 data-[active=true]:bg-primary/10 -mx-1 block w-fit max-w-full truncate rounded-sm px-1 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden data-[active=true]:underline"
            data-active={active}
            key={`${item.id}-${item.relation ?? item.name}`}
            to={item.link}
            onClick={(event) => {
              event.stopPropagation()
              if (active) event.preventDefault()
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {formatRelatedItemLabel(item)}
          </MyLink>
        )
      })}
    </div>
  )
}

function formatRelatedItemLabel(item: MonoRelatedItem) {
  return item.relation ? `${item.name} (${item.relation})` : item.name
}

function MonoRelatedListItem({
  item,
}: {
  item: Extract<MonoListPanelTab, { type: 'related' }>['relatedItems'][number]
}) {
  const active = useIsRouteActive(item.link)

  return (
    <PanelButtonItem active={active} to={item.link}>
      <PanelItemImage image={item.image} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">{item.name}</div>
        {item.subjectId ? (
          <MyLink
            className="text-primary hover:bg-primary/10 focus-visible:ring-ring/50 -mx-1 line-clamp-1 w-fit max-w-full rounded-sm px-1 text-xs underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
            to={`/subject/${item.subjectId}`}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {item.subjectNameCn || item.subjectName}
          </MyLink>
        ) : item.subjectName ? (
          <div className="text-muted-foreground line-clamp-1 text-xs">
            {item.subjectNameCn || item.subjectName}
          </div>
        ) : null}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          {item.subjectType && (
            <Badge variant="outline" className="text-xs">
              {SUBJECT_TYPE_MAP[item.subjectType]}
            </Badge>
          )}
          {item.relation && (
            <Badge variant="secondary" className="text-xs shadow-none">
              {item.relation}
            </Badge>
          )}
        </div>
      </div>
    </PanelButtonItem>
  )
}

function SubjectCharacterListItem({
  item,
}: {
  item: Extract<MonoListPanelTab, { type: 'subjectCharacters' }>['characters'][number]
}) {
  const actors = item.actors.map((actor) => actor.name).filter(Boolean)
  const to = `/character/${item.id}`
  const active = useIsRouteActive(to)

  return (
    <PanelLinkItem active={active} to={to}>
      <PanelItemImage image={item.images?.grid || item.images?.medium} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">{item.name}</div>
        {actors.length > 0 && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{actors.join(' / ')}</div>
        )}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          {item.relation && (
            <Badge variant="secondary" className="text-xs shadow-none">
              {item.relation}
            </Badge>
          )}
        </div>
      </div>
    </PanelLinkItem>
  )
}

function SubjectRelatedListItem({
  item,
}: {
  item: Extract<MonoListPanelTab, { type: 'subjectRelated' }>['relatedSubjects'][number]
}) {
  const to = `/subject/${item.id}`
  const active = useIsRouteActive(to)

  return (
    <PanelLinkItem active={active} to={to}>
      <PanelItemImage image={item.images.grid || item.images.common} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">{item.name_cn || item.name}</div>
        {item.name_cn && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{item.name}</div>
        )}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {SUBJECT_TYPE_MAP[item.type as SubjectType]}
          </Badge>
          {item.relation && (
            <Badge variant="secondary" className="text-xs shadow-none">
              {item.relation}
            </Badge>
          )}
        </div>
      </div>
    </PanelLinkItem>
  )
}

function SubjectEpisodeListItem({ item }: { item: Episode | CollectionEpisode }) {
  const episode = getPanelEpisode(item)
  const to = `/episode/${episode.id}`
  const active = useIsRouteActive(to)

  return (
    <PanelLinkItem active={active} to={to}>
      <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-md text-sm font-medium">
        {episode.sort}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-1 text-sm font-medium">
          {episode.name_cn || episode.name || `ep.${episode.sort}`}
        </div>
        {episode.name_cn && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{episode.name}</div>
        )}
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {EpisodeType[episode.type] ?? '其他'}
          </Badge>
          {episode.comment > 0 && (
            <Badge variant="secondary" className="text-xs shadow-none">
              {episode.comment} 吐槽
            </Badge>
          )}
        </div>
      </div>
    </PanelLinkItem>
  )
}

function getPanelEpisode(item: Episode | CollectionEpisode) {
  return (item as CollectionEpisode).episode ?? item
}

function PanelItemImage({ image }: { image?: string }) {
  return image ? (
    <Image
      imageSrc={image}
      className="flex aspect-square h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md"
      imageClassName="h-full w-full object-contain"
      loadingClassName="aspect-square h-16 w-16"
      careLoading
    />
  ) : (
    <div className="bg-muted h-16 w-16 shrink-0 rounded-md" />
  )
}

function PanelButtonItem({
  active,
  children,
  to,
}: PropsWithChildren<{ active: boolean; to: string }>) {
  const navigate = useNavigate()
  const ref = useActivePanelItemRef(active)

  const open = () => {
    if (!active) navigate(to)
  }

  return (
    <div
      className={PANEL_ITEM_CLASS}
      data-active={active}
      ref={ref}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        open()
      }}
    >
      {children}
    </div>
  )
}

function PanelLinkItem({
  active,
  children,
  to,
}: PropsWithChildren<{ active: boolean; to: string }>) {
  const ref = useActivePanelItemRef(active)

  return (
    <div ref={ref}>
      <MyLink
        className={PANEL_ITEM_CLASS}
        data-active={active}
        to={to}
        onClick={(event) => {
          if (active) event.preventDefault()
        }}
      >
        {children}
      </MyLink>
    </div>
  )
}

function useIsRouteActive(to: string) {
  const { pathname } = useLocation()
  return isRoutePathActive(pathname, to)
}

function useActivePanelItemRef(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const frame = window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [active])

  return ref
}

function normalizeRoutePath(path: string) {
  const pathOnly = path.split(/[?#]/)[0]
  if (pathOnly.length <= 1) return pathOnly
  return pathOnly.replace(/\/+$/, '')
}

function isRoutePathActive(pathname: string, to: string) {
  return normalizeRoutePath(pathname) === normalizeRoutePath(to)
}
