import { MyLink } from '@renderer/components/my-link'
import { AuthorLabel } from '@renderer/components/author-label'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useResourceIndexesQuery } from '@renderer/data/hooks/api/index'
import type { IndexResourceType, SlimIndex } from '@renderer/data/types/index'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { getIndexDisplayTitle } from '@renderer/modules/common/index-title'
import {
  OpenMonoListPanelButton,
  useMonoListPanelOpenHandler,
} from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { useMemo } from 'react'

const INDEX_PREVIEW_DISPLAY_LIMIT = 4
const INDEX_PREVIEW_FETCH_LIMIT = 12

export function MonoIndexesSection({
  resourceId,
  resourceType,
  sourceTitle,
  sourceTo,
}: {
  resourceId: string
  resourceType: IndexResourceType
  sourceTitle: string
  sourceTo: string
}) {
  const query = useResourceIndexesQuery({
    limit: INDEX_PREVIEW_FETCH_LIMIT,
    refetchPageLimit: 1,
    resourceId,
    resourceType,
  })
  const fetchedIndexes = query.data?.pages.flatMap((page) => page.data) ?? []
  const indexes = fetchedIndexes.slice(0, INDEX_PREVIEW_DISPLAY_LIMIT)
  const total = query.data?.pages[0]?.total ?? indexes.length
  const hasMore = total > INDEX_PREVIEW_DISPLAY_LIMIT
  const panelTab = useMemo(
    () =>
      ({
        id: `${resourceType}-indexes-${resourceId}`,
        panelTitle: '关联目录',
        resourceId,
        resourceType,
        sourceTitle,
        sourceTo,
        title: sourceTitle,
        type: 'monoIndexes',
      }) satisfies MonoListPanelTab,
    [resourceId, resourceType, sourceTitle, sourceTo],
  )
  const openInSidePanel = useMonoListPanelOpenHandler(panelTab)

  if (query.isLoading) return <MonoIndexesSkeleton />
  if (query.isError || indexes.length === 0) return null

  return (
    <section className="@container flex min-w-0 flex-col gap-2">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 flex-row items-center gap-2">
          <h2 className="text-base font-semibold">关联目录</h2>
          <span className="text-muted-foreground text-xs tabular-nums">{total}</span>
          <OpenMonoListPanelButton className="size-6" tab={panelTab} title="在侧栏打开关联目录" />
        </div>
        {hasMore && (
          <Button size="sm" onClick={openInSidePanel} variant="ghost">
            查看全部
          </Button>
        )}
      </div>
      <ul className="divide-y border-y">
        {indexes.map((index) => (
          <li key={index.id}>
            <MonoIndexRow index={index} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function MonoIndexRow({ index }: { index: SlimIndex }) {
  const title = getIndexDisplayTitle(index)

  return (
    <MyLink
      className="hover:bg-accent/40 focus-visible:ring-ring grid min-w-0 cursor-default grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-2 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none @xl:grid-cols-[minmax(0,1fr)_7rem_4rem_9rem]"
      to={`/index/${index.id}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h3 className="truncate text-sm font-medium" title={title}>
          {title}
        </h3>
        {index.private && (
          <Badge variant="outline" className="shrink-0 text-xs shadow-none">
            私密
          </Badge>
        )}
      </div>
      <span className="text-muted-foreground col-start-1 row-start-2 truncate text-xs @xl:col-start-2 @xl:row-start-1">
        <AuthorLabel
          name={index.user?.nickname || `#${index.uid}`}
          avatar={index.user?.avatar?.small}
        />
      </span>
      <span className="text-muted-foreground col-start-2 row-start-1 text-right text-xs whitespace-nowrap tabular-nums @xl:col-start-3">
        {index.total} 项
      </span>
      <span className="text-muted-foreground col-start-2 row-start-2 text-right text-xs whitespace-nowrap tabular-nums @xl:col-start-4 @xl:row-start-1">
        {formatRecentUnixTime(index.updatedAt)}
      </span>
    </MyLink>
  )
}

function MonoIndexesSkeleton() {
  return (
    <section
      className="@container flex flex-col gap-2"
      aria-label="正在加载关联目录"
      aria-busy="true"
    >
      <Skeleton className="h-8 w-28" />
      <div className="divide-y border-y">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-2 py-2.5 @xl:grid-cols-[minmax(0,1fr)_7rem_4rem_9rem]"
            key={index}
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </section>
  )
}
