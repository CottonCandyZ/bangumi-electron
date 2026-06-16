import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import {
  useIndexQuery,
  useIndexRelatedQuery,
  useResourceIndexesQuery,
} from '@renderer/data/hooks/api/index'
import type { IndexRelated, SlimIndex } from '@renderer/data/types/index'
import { cn } from '@renderer/lib/utils'
import {
  ALL_INDEX_RELATED_CATEGORIES,
  ALL_INDEX_RELATED_SUBJECT_TYPES,
  getIndexRelatedCategoryFilters,
  getIndexRelatedQueryFilters,
  getIndexRelatedSubjectTypeFilters,
  normalizeIndexRelatedCategoryFilter,
  normalizeIndexRelatedSubjectTypeFilter,
  shouldShowIndexRelatedCategoryFilter,
  shouldShowIndexRelatedSubjectTypeFilter,
} from '@renderer/modules/common/index-related-filters'
import { getIndexRelatedMeta } from '@renderer/modules/common/index-related-meta'
import { getIndexDisplayTitle } from '@renderer/modules/common/index-title'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { monoListPanelCenterActiveItemAtom } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  isRoutePathActive,
  MonoListPanelFilters,
  PanelFilterTabs,
  PanelItemImage,
  PanelLinkItem,
} from './shared'
import { useMonoListPanelRefreshAction } from './use-panel-refresh-action'

const INDEX_PANEL_LIMIT = 30

export function MonoIndexesListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'monoIndexes' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const indexesQuery = useResourceIndexesQuery({
    limit: INDEX_PANEL_LIMIT,
    resourceId: tab.resourceId,
    resourceType: tab.resourceType,
  })
  useMonoListPanelRefreshAction({
    onRefresh: () => indexesQuery.refetch(),
    refreshing: indexesQuery.isFetching && !indexesQuery.isFetchingNextPage,
    tabId: tab.id,
  })
  const indexes = useMemo(
    () => indexesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [indexesQuery.data],
  )
  const total = indexesQuery.data?.pages[0]?.total
  const activeIndex = useMemo(
    () => indexes.findIndex((item) => isRoutePathActive(pathname, `/index/${item.id}`)),
    [indexes, pathname],
  )

  if (indexesQuery.isLoading && indexes.length === 0) return <IndexPanelSkeletonList />

  if (indexesQuery.isError && indexes.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">暂时无法读取关联目录。</div>
  }

  return (
    <>
      <IndexPanelStatus
        label={`已加载 ${indexes.length.toLocaleString()}${total ? ` / ${total.toLocaleString()}` : ''} 个目录`}
        loading={indexesQuery.isFetching}
      />
      <SingleColumnVirtualList
        activeIndex={centerActiveItem ? activeIndex : undefined}
        appendPlaceholderCount={INDEX_PANEL_LIMIT}
        className="px-2 py-2"
        empty={<div className="text-muted-foreground p-4 text-sm">没有关联目录。</div>}
        estimateSize={84}
        gap={4}
        getKey={(item) => item.id}
        hasMore={!indexesQuery.isFetchNextPageError && !!indexesQuery.hasNextPage}
        isFetchingMore={indexesQuery.isFetchingNextPage}
        items={indexes}
        onNearBottom={() => indexesQuery.fetchNextPage()}
        renderItem={(item) => <SubjectIndexPanelItem index={item} />}
        renderPlaceholder={() => <IndexPanelSkeletonItem />}
        rootClassName="flex-1"
        scrollAreaKey={`mono-list:${tab.id}`}
        showBackToTop
      />
    </>
  )
}

export function IndexRelatedListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'indexRelated' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const categoryFilterId = `${tab.id}-panel-category`
  const subjectTypeFilterId = `${tab.id}-panel-subject-type`
  const indexQuery = useIndexQuery({ indexId: tab.indexId, enabled: Number.isFinite(tab.indexId) })
  const categoryFilters = getIndexRelatedCategoryFilters(indexQuery.data?.stats)
  const subjectTypeFilters = getIndexRelatedSubjectTypeFilters(indexQuery.data?.stats)
  const showCategoryFilter = shouldShowIndexRelatedCategoryFilter(categoryFilters)
  const categoryOptions = [
    ALL_INDEX_RELATED_CATEGORIES,
    ...categoryFilters.map((item) => item.label),
  ]
  const categoryFilter = normalizeIndexRelatedCategoryFilter(
    filterMap.get(categoryFilterId),
    categoryOptions,
  )
  const showSubjectTypeFilter = shouldShowIndexRelatedSubjectTypeFilter({
    categoryFilter,
    showCategoryFilter,
    subjectTypeFilters,
  })
  const subjectTypeOptions = [
    ALL_INDEX_RELATED_SUBJECT_TYPES,
    ...subjectTypeFilters.map((item) => item.label),
  ]
  const subjectTypeFilter = normalizeIndexRelatedSubjectTypeFilter(
    filterMap.get(subjectTypeFilterId),
    subjectTypeOptions,
  )
  const queryFilters = getIndexRelatedQueryFilters({
    categoryFilter,
    showCategoryFilter,
    subjectTypeFilter: showSubjectTypeFilter ? subjectTypeFilter : ALL_INDEX_RELATED_SUBJECT_TYPES,
  })
  const relatedQuery = useIndexRelatedQuery({
    cat: queryFilters.cat,
    indexId: tab.indexId,
    limit: INDEX_PANEL_LIMIT,
    type: queryFilters.type,
  })
  useMonoListPanelRefreshAction({
    onRefresh: () => relatedQuery.refetch(),
    refreshing: relatedQuery.isFetching && !relatedQuery.isFetchingNextPage,
    tabId: tab.id,
  })
  const items = useMemo(
    () => relatedQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [relatedQuery.data],
  )
  const total = relatedQuery.data?.pages[0]?.total
  const activeIndex = useMemo(
    () =>
      items.findIndex((item) => {
        const to = getIndexRelatedMeta(item).to
        return to ? isRoutePathActive(pathname, to) : false
      }),
    [items, pathname],
  )

  if (relatedQuery.isLoading && items.length === 0) {
    return (
      <>
        <IndexRelatedPanelFilters
          categoryFilter={categoryFilter}
          categoryFilterId={categoryFilterId}
          categoryOptions={categoryOptions}
          setFilter={setFilter}
          showCategoryFilter={showCategoryFilter}
          showSubjectTypeFilter={showSubjectTypeFilter}
          subjectTypeFilter={subjectTypeFilter}
          subjectTypeFilterId={subjectTypeFilterId}
          subjectTypeOptions={subjectTypeOptions}
        />
        <IndexPanelSkeletonList />
      </>
    )
  }

  if (relatedQuery.isError && items.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">暂时无法读取目录内容。</div>
  }

  return (
    <>
      <IndexRelatedPanelFilters
        categoryFilter={categoryFilter}
        categoryFilterId={categoryFilterId}
        categoryOptions={categoryOptions}
        setFilter={setFilter}
        showCategoryFilter={showCategoryFilter}
        showSubjectTypeFilter={showSubjectTypeFilter}
        subjectTypeFilter={subjectTypeFilter}
        subjectTypeFilterId={subjectTypeFilterId}
        subjectTypeOptions={subjectTypeOptions}
      />
      <IndexPanelStatus
        label={`已加载 ${items.length.toLocaleString()}${total ? ` / ${total.toLocaleString()}` : ''} 个内容`}
        loading={relatedQuery.isFetching}
      />
      <SingleColumnVirtualList
        activeIndex={centerActiveItem ? activeIndex : undefined}
        appendPlaceholderCount={INDEX_PANEL_LIMIT}
        className="px-2 py-2"
        empty={<div className="text-muted-foreground p-4 text-sm">没有符合条件的内容。</div>}
        estimateSize={92}
        gap={4}
        getKey={(item) => item.id}
        hasMore={!relatedQuery.isFetchNextPageError && !!relatedQuery.hasNextPage}
        isFetchingMore={relatedQuery.isFetchingNextPage}
        items={items}
        onNearBottom={() => relatedQuery.fetchNextPage()}
        renderItem={(item) => <IndexRelatedPanelItem item={item} />}
        renderPlaceholder={() => <IndexPanelSkeletonItem />}
        rootClassName="flex-1"
        scrollAreaKey={`mono-list:${tab.id}:category:${categoryFilter}:subject-type:${subjectTypeFilter}`}
        showBackToTop
      />
    </>
  )
}

function IndexRelatedPanelFilters({
  categoryFilter,
  categoryFilterId,
  categoryOptions,
  setFilter,
  showCategoryFilter,
  showSubjectTypeFilter,
  subjectTypeFilter,
  subjectTypeFilterId,
  subjectTypeOptions,
}: {
  categoryFilter: string
  categoryFilterId: string
  categoryOptions: string[]
  setFilter: (id: string, value: string) => void
  showCategoryFilter: boolean
  showSubjectTypeFilter: boolean
  subjectTypeFilter: string
  subjectTypeFilterId: string
  subjectTypeOptions: string[]
}) {
  if (!showCategoryFilter && !showSubjectTypeFilter) return null

  return (
    <MonoListPanelFilters>
      {showCategoryFilter && (
        <PanelFilterTabs
          currentSelect={categoryFilter}
          label="内容类型"
          layoutId={categoryFilterId}
          setCurrentSelect={setFilter}
          tabsContent={new Set(categoryOptions)}
        />
      )}
      {showSubjectTypeFilter && (
        <PanelFilterTabs
          currentSelect={subjectTypeFilter}
          label="条目类型"
          layoutId={subjectTypeFilterId}
          setCurrentSelect={setFilter}
          tabsContent={new Set(subjectTypeOptions)}
        />
      )}
    </MonoListPanelFilters>
  )
}

function IndexPanelStatus({ label, loading = false }: { label: string; loading?: boolean }) {
  return (
    <MonoListPanelFilters>
      <div className="text-muted-foreground flex w-full items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        {loading && <span>刷新中</span>}
      </div>
    </MonoListPanelFilters>
  )
}

function SubjectIndexPanelItem({ index }: { index: SlimIndex }) {
  const to = `/index/${index.id}`
  const active = isRoutePathActive(useLocation().pathname, to)
  const title = getIndexDisplayTitle(index)

  return (
    <PanelLinkItem active={active} to={to}>
      <PanelItemImage />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-2 text-sm font-medium">{title}</div>
        <div className="text-muted-foreground line-clamp-1 text-xs">
          {index.user?.nickname ? `by ${index.user.nickname}` : `#${index.uid}`}
        </div>
        <div className="mt-auto flex flex-row flex-wrap gap-1">
          <Badge variant="outline" className="text-xs shadow-none">
            {index.total} 项
          </Badge>
          {index.private && (
            <Badge variant="secondary" className="text-xs shadow-none">
              私密
            </Badge>
          )}
        </div>
      </div>
    </PanelLinkItem>
  )
}

function IndexRelatedPanelItem({ item }: { item: IndexRelated }) {
  const { pathname } = useLocation()
  const meta = getIndexRelatedMeta(item)
  const active = meta.to ? isRoutePathActive(pathname, meta.to) : false
  const content = (
    <>
      <PanelItemImage image={meta.image} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-row items-center gap-2">
          <Badge variant="outline" className="shrink-0 text-xs shadow-none">
            {meta.kind}
          </Badge>
          <div className="line-clamp-1 min-w-0 text-sm font-medium">{meta.title}</div>
        </div>
        {meta.subtitle && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{meta.subtitle}</div>
        )}
        {item.comment.trim() && (
          <div className="text-muted-foreground line-clamp-2 text-xs">{item.comment}</div>
        )}
      </div>
    </>
  )

  if (meta.to) {
    return (
      <PanelLinkItem active={active} to={meta.to}>
        {content}
      </PanelLinkItem>
    )
  }

  if (meta.href) {
    return (
      <a
        className={cn('hover:bg-accent flex min-h-20 cursor-default flex-row gap-3 rounded-md p-2')}
        href={meta.href}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="hover:bg-accent flex min-h-20 cursor-default flex-row gap-3 rounded-md p-2">
      {content}
    </div>
  )
}

function IndexPanelSkeletonList() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <IndexPanelSkeletonItem key={index} />
      ))}
    </div>
  )
}

function IndexPanelSkeletonItem() {
  return (
    <div className="flex min-h-20 flex-row gap-3 rounded-md p-2">
      <Skeleton className="size-16 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
