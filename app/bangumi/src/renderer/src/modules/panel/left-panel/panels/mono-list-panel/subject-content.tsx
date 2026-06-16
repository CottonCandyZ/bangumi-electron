import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCollectionEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/collection'
import { useEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/episodes'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionEpisode } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { SubjectType } from '@renderer/data/types/subject'
import {
  PageSelector,
  PageSelectorSkeleton,
} from '@renderer/modules/common/episodes/grid/page-selector'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import {
  ALL_SUBJECT_RELATIONS,
  isRoutePathActive,
  MonoListPanelFilters,
  MonoPanelInfiniteList,
  PanelFilterTabs,
  PanelItemImage,
  PanelLinkItem,
  SUBJECT_TYPE_MAP,
  useIsRouteActive,
} from './shared'
import { useLocation } from 'react-router-dom'

export function SubjectCharacterListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectCharacters' }>
}) {
  const { pathname } = useLocation()
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
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, `/character/${item.id}`)),
    [items, pathname],
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
      <MonoPanelInfiniteList
        activeIndex={activeIndex}
        scrollAreaKey={`mono-list:${tab.id}:relation:${filter}`}
      >
        {items.map((item) => (
          <div key={item.id}>
            <SubjectCharacterListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

export function SubjectRelatedListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectRelated' }>
}) {
  const { pathname } = useLocation()
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
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, `/subject/${item.id}`)),
    [items, pathname],
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
      <MonoPanelInfiniteList
        activeIndex={activeIndex}
        scrollAreaKey={`mono-list:${tab.id}:relation:${filter}`}
      >
        {items.map((item) => (
          <div key={`${item.id}-${item.relation}`}>
            <SubjectRelatedListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

export function SubjectEpisodeListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectEpisodes' }>
}) {
  const { pathname } = useLocation()
  const userInfo = useSession()
  const [offset, setOffset] = useState(tab.initialOffset ?? 0)
  const limit = 100
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId: tab.subjectId,
    offset,
    limit,
    enabled: userInfo === null,
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
  const activeIndex = episodeQuery.data.data.findIndex((item) =>
    isRoutePathActive(pathname, `/episode/${getPanelEpisode(item).id}`),
  )

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
      <MonoPanelInfiniteList
        activeIndex={activeIndex}
        scrollAreaKey={`mono-list:${tab.id}:offset:${offset}`}
      >
        {episodeQuery.data.data.map((item) => (
          <div key={getPanelEpisode(item).id}>
            <SubjectEpisodeListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

export function SubjectTankobonListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjectTankobon' }>
}) {
  const { pathname } = useLocation()
  const activeIndex = useMemo(
    () =>
      tab.relatedSubjects.findIndex((item) => isRoutePathActive(pathname, `/subject/${item.id}`)),
    [pathname, tab.relatedSubjects],
  )

  return (
    <MonoPanelInfiniteList activeIndex={activeIndex} scrollAreaKey={`mono-list:${tab.id}`}>
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
        <PageSelectorSkeleton />
      </MonoListPanelFilters>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-md" />
        ))}
      </div>
    </>
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
