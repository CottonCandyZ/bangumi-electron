import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { Button } from '@renderer/components/ui/button'
import {
  hasUserTimelineItemDetails,
  UserTimelineItemCard,
  UserTimelineSkeletonItem,
} from '@renderer/modules/common/user/timeline'
import { useUserTimelineInfiniteQuery } from '@renderer/data/hooks/api/user'
import { useSession } from '@renderer/data/hooks/session'
import { UserTimelineItem } from '@renderer/data/types/user'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { cn } from '@renderer/lib/utils'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

const USER_TIMELINE_PAGE_LIMIT = 20
const ESTIMATED_TIMELINE_ITEM_HEIGHT = 132
const VIRTUAL_OVERSCAN = 6
const APPEND_SKELETON_COUNT = 4
const LOAD_MORE_ROW_THRESHOLD = 6

type UserTimelineRow =
  | {
      type: 'day'
      key: string
      label: string
    }
  | {
      type: 'item'
      key: number
      item: UserTimelineItem
    }

export function UserTimelinePanel() {
  const session = useSession()
  const open = useAtomValue(rightPanelOpenAtom)
  const params = useParams()
  const username = params.username ?? session?.username
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0)
  const timelineQuery = useUserTimelineInfiniteQuery({
    username,
    limit: USER_TIMELINE_PAGE_LIMIT,
    enabled: !!username && open,
  })
  const entries = useMemo(() => {
    const seen = new Set<number>()
    return timelineQuery.data?.pages.flatMap((page) =>
      page.flatMap((item) => {
        if (!hasUserTimelineItemDetails(item)) return []
        if (seen.has(item.id)) return []
        seen.add(item.id)
        return [item]
      }),
    )
  }, [timelineQuery.data])
  const loadMore = useCallback(() => {
    if (timelineQuery.isError || !timelineQuery.hasNextPage || timelineQuery.isFetchingNextPage) {
      return undefined
    }

    return timelineQuery.fetchNextPage()
  }, [timelineQuery])
  const refreshTimeline = useCallback(() => {
    setScrollToTopSignal((value) => value + 1)
    return timelineQuery.refreshFirstPage()
  }, [timelineQuery])

  useEffect(() => {
    if (!open || entries === undefined || entries.length > 0 || !timelineQuery.hasNextPage) return
    loadMore()
  }, [entries, loadMore, open, timelineQuery.hasNextPage])

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="drag-region flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
        <div className="no-drag-region flex min-w-0 flex-row items-baseline gap-2">
          <h2 className="line-clamp-1 text-sm font-medium">时间线</h2>
          {username && (
            <span className="text-muted-foreground line-clamp-1 min-w-0 text-xs">@{username}</span>
          )}
        </div>
        <Button
          className="no-drag-region size-8 shrink-0"
          disabled={timelineQuery.isFetching}
          onClick={refreshTimeline}
          size="icon"
          title="刷新时间线"
          variant="ghost"
        >
          <span
            className={cn(
              'i-mingcute-refresh-2-line text-base',
              timelineQuery.isFetching && 'animate-spin',
            )}
          />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <UserTimelineVirtualGrid
          entries={entries}
          error={timelineQuery.isError}
          hasMore={!!timelineQuery.hasNextPage}
          isFetchingMore={timelineQuery.isFetchingNextPage}
          onListNearBottom={loadMore}
          scrollMemoryKey={username ? `user-timeline-${username}` : undefined}
          scrollToTopSignal={scrollToTopSignal}
        />
      </div>
    </div>
  )
}

function UserTimelineVirtualGrid({
  entries,
  error,
  hasMore,
  isFetchingMore,
  onListNearBottom,
  scrollMemoryKey,
  scrollToTopSignal,
}: {
  entries: UserTimelineItem[] | undefined
  error: boolean
  hasMore: boolean
  isFetchingMore: boolean
  onListNearBottom: () => Promise<unknown> | void
  scrollMemoryKey?: string
  scrollToTopSignal: number
}) {
  const rows = useMemo(() => (entries ? toTimelineRows(entries) : undefined), [entries])
  const requestMore = useCallback(() => {
    if (!hasMore || isFetchingMore) return

    return onListNearBottom()
  }, [hasMore, isFetchingMore, onListNearBottom])

  if (rows === undefined && !error) {
    return <UserTimelineSkeletonScroll count={8} />
  }

  if (error) {
    return <div className="text-muted-foreground p-4 text-sm">暂时无法读取时间线。</div>
  }

  if (!rows || rows.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">还没有动态。</div>
  }

  return (
    <SingleColumnVirtualList
      items={rows}
      getKey={(row) => row.key}
      renderItem={(row) =>
        row.type === 'day' ? (
          <UserTimelineDayHeader label={row.label} />
        ) : (
          <UserTimelineItemCard compact expanded item={row.item} surface="timeline" />
        )
      }
      appendPlaceholderCount={APPEND_SKELETON_COUNT}
      className="px-3 py-3"
      estimateSize={ESTIMATED_TIMELINE_ITEM_HEIGHT}
      gap={12}
      hasMore={hasMore}
      isFetchingMore={isFetchingMore}
      loadMoreRowThreshold={LOAD_MORE_ROW_THRESHOLD}
      onNearBottom={requestMore}
      overscan={VIRTUAL_OVERSCAN}
      renderPlaceholder={() => <UserTimelineSkeletonItem surface="timeline" />}
      rootClassName="h-full"
      scrollMemoryKey={scrollMemoryKey}
      scrollToTopSignal={scrollToTopSignal}
    />
  )
}

function toTimelineRows(entries: UserTimelineItem[]) {
  const rows: UserTimelineRow[] = []
  let lastDayKey: string | undefined

  entries.forEach((item) => {
    const day = dayjs.unix(item.createdAt)
    const dayKey = day.format('YYYY-MM-DD')

    if (dayKey !== lastDayKey) {
      rows.push({
        type: 'day',
        key: `day-${dayKey}`,
        label: formatTimelineDayLabel(day),
      })
      lastDayKey = dayKey
    }

    rows.push({
      type: 'item',
      key: item.id,
      item,
    })
  })

  return rows
}

function formatTimelineDayLabel(day: dayjs.Dayjs) {
  const today = dayjs().startOf('day')
  const target = day.startOf('day')

  if (target.isSame(today)) return '今天'
  if (target.isSame(today.subtract(1, 'day'))) return '昨天'
  return target.format('YYYY-MM-DD')
}

function UserTimelineDayHeader({ label }: { label: string }) {
  return (
    <div className="bg-background/95 sticky top-0 z-10 flex items-center gap-2 py-2 text-xs font-medium backdrop-blur">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="bg-border h-px min-w-0 flex-1" />
    </div>
  )
}

function UserTimelineSkeletonScroll({ count }: { count: number }) {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden px-3 py-3">
      {Array(count)
        .fill(undefined)
        .map((_, index) => (
          <UserTimelineSkeletonItem key={index} surface="timeline" />
        ))}
    </div>
  )
}
