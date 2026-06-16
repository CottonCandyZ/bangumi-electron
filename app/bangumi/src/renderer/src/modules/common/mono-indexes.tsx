import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
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
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">关联目录</h2>
          <OpenMonoListPanelButton
            className="mt-1 size-8"
            tab={panelTab}
            title="在侧栏打开关联目录"
          />
        </div>
        {total > 0 && <span className="text-muted-foreground text-sm">{total}</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2">
        {indexes.map((index) => (
          <MonoIndexCard index={index} key={index.id} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={openInSidePanel} variant="outline">
            在侧栏查看更多 {indexes.length}/{total}
          </Button>
        </div>
      )}
    </section>
  )
}

function MonoIndexCard({ index }: { index: SlimIndex }) {
  const title = getIndexDisplayTitle(index)

  return (
    <MyLink className="group cursor-default" to={`/index/${index.id}`}>
      <Card className="group-hover:bg-accent h-full rounded-md shadow-none transition-colors">
        <CardContent className="flex h-full flex-col gap-3 p-3">
          <div className="flex min-w-0 flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-medium">{title}</h3>
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                {index.user?.nickname ? `by ${index.user.nickname}` : `#${index.uid}`}
              </p>
            </div>
            {index.private && (
              <Badge variant="outline" className="shrink-0 text-xs shadow-none">
                私密
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground mt-auto flex flex-row flex-wrap gap-2 text-xs">
            <span>{index.total} 项</span>
            <span>{formatRecentUnixTime(index.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </MyLink>
  )
}

function MonoIndexesSkeleton() {
  return (
    <section className="flex flex-col gap-5">
      <Skeleton className="h-8 w-28" />
      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="flex h-28 flex-col gap-3 rounded-md border p-3" key={index}>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-auto h-3 w-1/3" />
          </div>
        ))}
      </div>
    </section>
  )
}
