import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import type { MonoRelatedItem } from '@renderer/data/types/mono'
import { splitRelationLabels } from '@renderer/lib/utils/relation'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ALL_RELATED_TYPES,
  ALL_SUBJECT_RELATIONS,
  ALL_SUBJECT_TYPES,
  isRoutePathActive,
  MonoListPanelFilters,
  MonoPanelInfiniteList,
  PanelButtonItem,
  PanelFilterTabs,
  PanelItemImage,
  SUBJECT_TYPE_MAP,
  useActivePanelItemRef,
  useIsRouteActive,
} from './shared'

export function MonoSubjectListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'subjects' }>
}) {
  const { pathname } = useLocation()
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const typeFilterId = `${tab.id}-panel-type`
  const relationFilterId = `${tab.id}-panel-relation`
  const typeFilter = filterMap.get(typeFilterId) ?? ALL_SUBJECT_TYPES
  const relationFilter = filterMap.get(relationFilterId) ?? ALL_SUBJECT_RELATIONS
  const subjectsMatchingRelation = useMemo(
    () =>
      tab.subjects.filter(
        (subject) =>
          relationFilter === ALL_SUBJECT_RELATIONS ||
          splitRelationLabels(subject.relation).includes(relationFilter),
      ),
    [relationFilter, tab.subjects],
  )
  const subjectsMatchingType = useMemo(
    () =>
      tab.subjects.filter(
        (subject) =>
          typeFilter === ALL_SUBJECT_TYPES || SUBJECT_TYPE_MAP[subject.subjectType] === typeFilter,
      ),
    [tab.subjects, typeFilter],
  )
  const typeFilters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_TYPES,
        ...subjectsMatchingRelation.map((subject) => SUBJECT_TYPE_MAP[subject.subjectType]),
      ]),
    [subjectsMatchingRelation],
  )
  const relationFilters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_RELATIONS,
        ...subjectsMatchingType.flatMap((subject) => splitRelationLabels(subject.relation)),
      ]),
    [subjectsMatchingType],
  )

  useEffect(() => {
    if (typeFilter !== ALL_SUBJECT_TYPES && !typeFilters.has(typeFilter)) {
      setFilter(typeFilterId, ALL_SUBJECT_TYPES)
    }
  }, [setFilter, typeFilter, typeFilterId, typeFilters])

  useEffect(() => {
    if (relationFilter !== ALL_SUBJECT_RELATIONS && !relationFilters.has(relationFilter)) {
      setFilter(relationFilterId, ALL_SUBJECT_RELATIONS)
    }
  }, [relationFilter, relationFilterId, relationFilters, setFilter])

  const items = useMemo(
    () =>
      tab.subjects.filter((subject) => {
        const matchesType =
          typeFilter === ALL_SUBJECT_TYPES || SUBJECT_TYPE_MAP[subject.subjectType] === typeFilter
        const matchesRelation =
          relationFilter === ALL_SUBJECT_RELATIONS ||
          splitRelationLabels(subject.relation).includes(relationFilter)
        return matchesType && matchesRelation
      }),
    [relationFilter, tab.subjects, typeFilter],
  )
  const activeIndex = useMemo(
    () =>
      items.findIndex(
        (item) =>
          isRoutePathActive(pathname, `/subject/${item.id}`) ||
          item.relatedItems?.some((relatedItem) => isRoutePathActive(pathname, relatedItem.link)),
      ),
    [items, pathname],
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
      <MonoPanelInfiniteList
        activeIndex={activeIndex}
        scrollAreaKey={`mono-list:${tab.id}:type:${typeFilter}:relation:${relationFilter}`}
      >
        {items.map((item) => (
          <div key={`${item.id}-${item.relation}`}>
            <MonoSubjectListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
  )
}

export function MonoRelatedListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'related' }>
}) {
  const { pathname } = useLocation()
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
  const activeIndex = useMemo(
    () => items.findIndex((item) => isRoutePathActive(pathname, item.link)),
    [items, pathname],
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
      <MonoPanelInfiniteList
        activeIndex={activeIndex}
        scrollAreaKey={`mono-list:${tab.id}:${filter}`}
      >
        {items.map((item) => (
          <div key={`${item.id}-${item.subjectId ?? item.relation ?? item.name}`}>
            <MonoRelatedListItem item={item} />
          </div>
        ))}
      </MonoPanelInfiniteList>
    </>
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
        <div className="mt-auto flex min-w-0 flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {SUBJECT_TYPE_MAP[item.subjectType]}
          </Badge>
          {item.relation && (
            <Badge
              variant="secondary"
              className="max-w-full min-w-0 text-xs shadow-none"
              title={item.relation}
            >
              <span className="min-w-0 truncate">{item.relation}</span>
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
