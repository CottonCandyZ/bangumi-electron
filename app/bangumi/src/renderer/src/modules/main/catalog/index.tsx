import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Tabs } from '@renderer/components/tabs'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { UserHoverCardLink } from '@renderer/components/user-hover-card'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useIndexQuery, useIndexRelatedQuery } from '@renderer/data/hooks/api/index'
import type { IndexRelated } from '@renderer/data/types/index'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
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
import { ResourceCollectionButton } from '@renderer/modules/common/collections/resource-collection-button'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { indexTitleInViewAtom } from '@renderer/state/in-view'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { scrollViewportAtom } from '@renderer/state/scroll'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef, type ReactNode } from 'react'

const INDEX_RELATED_LIMIT = 30
const INDEX_TITLE_HEADER_SHOW_OFFSET = 64
const INDEX_TITLE_HEADER_HIDE_OFFSET = 96

export function IndexDetail({ indexId }: { indexId: number }) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const scrollViewport = useAtomValue(scrollViewportAtom)
  const titleInView = useAtomValue(indexTitleInViewAtom)
  const setTitleInView = useSetAtom(indexTitleInViewAtom)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const titleInViewRef = useRef(true)
  const indexQuery = useIndexQuery({ indexId, enabled: Number.isFinite(indexId) })
  const categoryFilterId = `index-related-${indexId}-category`
  const subjectTypeFilterId = `index-related-${indexId}-subject-type`
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
    indexId,
    limit: INDEX_RELATED_LIMIT,
    type: queryFilters.type,
    enabled: Number.isFinite(indexId) && !!indexQuery.data,
  })
  const relatedItems = relatedQuery.data?.pages.flatMap((page) => page.data) ?? []

  useEffect(() => {
    setTitleInView(true)
    return () => setTitleInView(true)
  }, [indexId, setTitleInView])

  useEffect(() => {
    titleInViewRef.current = titleInView

    if (!scrollViewport) return

    let raf = 0
    const updateTitleInView = () => {
      raf = 0
      const titleElement = titleRef.current
      if (!titleElement) return

      const titleBottom = titleElement.getBoundingClientRect().bottom
      const viewportTop = scrollViewport.getBoundingClientRect().top
      const currentInView = titleInViewRef.current
      let nextInView = currentInView

      if (currentInView && titleBottom <= viewportTop + INDEX_TITLE_HEADER_SHOW_OFFSET) {
        nextInView = false
      } else if (!currentInView && titleBottom >= viewportTop + INDEX_TITLE_HEADER_HIDE_OFFSET) {
        nextInView = true
      }

      if (nextInView === currentInView) return

      titleInViewRef.current = nextInView
      setTitleInView(nextInView)
    }
    const scheduleUpdate = () => {
      if (raf) return
      raf = window.requestAnimationFrame(updateTitleInView)
    }

    updateTitleInView()
    scrollViewport.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      scrollViewport.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [indexId, indexQuery.data?.id, scrollViewport, setTitleInView, titleInView])

  usePageScrollRestoreReady(
    (!indexQuery.isLoading || indexQuery.isError) &&
      (!relatedQuery.isLoading || relatedQuery.isError),
  )

  if (!Number.isFinite(indexId)) {
    return <IndexMessage text="目录 ID 无效。" />
  }

  if (indexQuery.isLoading) return <IndexSkeleton />
  if (indexQuery.isError || !indexQuery.data) return <IndexMessage text="暂时无法读取目录。" />

  const index = indexQuery.data
  const indexTitle = getIndexDisplayTitle(index)
  const relatedPanelTab = {
    id: `index-related-${indexId}`,
    indexId,
    panelTitle: '目录内容',
    sourceTitle: indexTitle,
    sourceTo: `/index/${indexId}`,
    title: indexTitle,
    type: 'indexRelated',
  } satisfies MonoListPanelTab

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-10 py-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Badge variant="outline" className="shadow-none">
            目录
          </Badge>
          {index.private && (
            <Badge variant="secondary" className="shadow-none">
              私密
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 text-3xl leading-tight font-semibold" ref={titleRef}>
              {indexTitle}
            </h1>
            <ResourceCollectionButton
              className="shrink-0"
              collected={!!index.collectedAt}
              resourceId={index.id}
              resourceType="index"
            />
          </div>
          <div className="text-muted-foreground flex flex-row flex-wrap gap-x-3 gap-y-1 text-sm">
            <span>{index.total} 项</span>
            <span>{index.replies} 回复</span>
            <span>{index.collects} 收藏</span>
            <span>{formatRecentUnixTime(index.updatedAt)}</span>
            {index.user && (
              <UserHoverCardLink
                className="hover:text-primary transition-colors"
                to={`/user/${encodeURIComponent(index.user.username)}`}
                user={index.user}
              >
                by {index.user.nickname || index.user.username}
              </UserHoverCardLink>
            )}
          </div>
        </div>
        {index.desc.trim() && (
          <div className="bbcode text-sm leading-7 whitespace-pre-line">
            {renderBBCode(index.desc)}
          </div>
        )}
      </section>

      <section className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-row items-center gap-2">
            <h2 className="text-2xl font-medium">关联内容</h2>
            <OpenMonoListPanelButton
              className="mt-1 size-8"
              tab={relatedPanelTab}
              title="在侧栏打开目录内容"
            />
          </div>
          <div className="flex flex-row items-center gap-1">
            <Button
              disabled={relatedQuery.isFetching && !relatedQuery.isFetchingNextPage}
              onClick={() => relatedQuery.refetch()}
              size="sm"
              variant="ghost"
            >
              {relatedQuery.isFetching && !relatedQuery.isFetchingNextPage ? (
                <span className="i-mingcute-loading-line animate-spin text-base" />
              ) : (
                <span className="i-mingcute-refresh-2-line text-base" />
              )}
              刷新
            </Button>
          </div>
        </div>
        <IndexRelatedFilters
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
        {relatedQuery.isLoading ? (
          <IndexRelatedSkeletonList />
        ) : relatedQuery.isError ? (
          <p className="text-muted-foreground text-sm">暂时无法读取关联内容。</p>
        ) : (
          <SingleColumnVirtualList
            appendPlaceholderCount={INDEX_RELATED_LIMIT}
            className="py-1"
            empty={<p className="text-muted-foreground text-sm">还没有关联内容。</p>}
            estimateSize={96}
            gap={6}
            getKey={(item) => item.id}
            hasMore={!!relatedQuery.hasNextPage}
            isFetchingMore={relatedQuery.isFetchingNextPage}
            items={relatedItems}
            onNearBottom={() => relatedQuery.fetchNextPage()}
            renderItem={(item) => <IndexRelatedItem item={item} />}
            renderPlaceholder={() => <IndexRelatedSkeleton />}
            rootClassName="min-h-80"
            scrollAreaKey={`index-related:${indexId}:category:${categoryFilter}:subject-type:${subjectTypeFilter}`}
            showBackToTop
          />
        )}
      </section>
    </div>
  )
}

function IndexRelatedFilters({
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
    <div className="flex flex-col items-start gap-2">
      {showCategoryFilter && (
        <IndexRelatedFilterRow label="内容类型">
          <Tabs
            className="justify-start"
            currentSelect={categoryFilter}
            layoutId={categoryFilterId}
            setCurrentSelect={setFilter}
            tabsContent={new Set(categoryOptions)}
          />
        </IndexRelatedFilterRow>
      )}
      {showSubjectTypeFilter && (
        <IndexRelatedFilterRow label="条目类型">
          <Tabs
            className="justify-start"
            currentSelect={subjectTypeFilter}
            layoutId={subjectTypeFilterId}
            setCurrentSelect={setFilter}
            tabsContent={new Set(subjectTypeOptions)}
          />
        </IndexRelatedFilterRow>
      )}
    </div>
  )
}

function IndexRelatedFilterRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex max-w-full flex-row flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">{label}</span>
      {children}
    </div>
  )
}

function IndexRelatedItem({ item }: { item: IndexRelated }) {
  const meta = getIndexRelatedMeta(item)
  const content = (
    <Card className="hover:bg-accent rounded-md shadow-none transition-colors">
      <CardContent className="flex min-h-20 flex-row gap-3 p-3">
        {meta.image ? (
          <Image
            className="size-14 shrink-0 overflow-hidden rounded-md border"
            imageClassName={
              meta.imageClassName ?? (meta.imageContain ? 'object-contain' : undefined)
            }
            imageSrc={meta.image}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-md border text-xs font-medium">
            {meta.kind.slice(0, 1)}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 flex-row items-center gap-2">
            <Badge variant="outline" className="shrink-0 text-xs shadow-none">
              {meta.kind}
            </Badge>
            <h3 className="line-clamp-1 text-sm font-medium">{meta.title}</h3>
          </div>
          {meta.subtitle && (
            <div className="text-muted-foreground line-clamp-1 text-xs">{meta.subtitle}</div>
          )}
          {item.comment.trim() && (
            <div className="text-muted-foreground line-clamp-2 text-xs">{item.comment}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (meta.to) {
    return (
      <MyLink className="block cursor-default" to={meta.to}>
        {content}
      </MyLink>
    )
  }

  if (meta.href) {
    return (
      <a className="block cursor-default" href={meta.href} rel="noreferrer" target="_blank">
        {content}
      </a>
    )
  }

  return content
}

function IndexMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  )
}

function IndexSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-10 py-8">
      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-24 w-full" />
      </section>
      <IndexRelatedSkeletonList />
    </div>
  )
}

function IndexRelatedSkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <IndexRelatedSkeleton key={index} />
      ))}
    </div>
  )
}

function IndexRelatedSkeleton() {
  return (
    <div className="flex min-h-20 flex-row gap-3 rounded-md border p-3">
      <Skeleton className="size-14 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
