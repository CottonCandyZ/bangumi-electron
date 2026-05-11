import { ScrollArea } from '@base-ui/react/scroll-area'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  hasUserTimelineItemDetails,
  UserTimelineItemCard,
  UserTimelineSkeletonItem,
} from '@renderer/modules/common/user/timeline'
import { useUserTimelineInfiniteQuery } from '@renderer/data/hooks/api/user'
import { useSession } from '@renderer/data/hooks/session'
import { UserTimelineItem } from '@renderer/data/types/user'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'
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

  useEffect(() => {
    if (!open || entries === undefined || entries.length > 0 || !timelineQuery.hasNextPage) return
    loadMore()
  }, [entries, loadMore, open, timelineQuery.hasNextPage])

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="drag-region flex h-14 shrink-0 items-center border-b px-3">
        <div className="no-drag-region flex min-w-0 flex-row items-baseline gap-2">
          <h2 className="line-clamp-1 text-sm font-medium">时间线</h2>
          {username && (
            <span className="text-muted-foreground line-clamp-1 min-w-0 text-xs">@{username}</span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <UserTimelineVirtualGrid
          entries={entries}
          error={timelineQuery.isError}
          hasMore={!!timelineQuery.hasNextPage}
          isFetchingMore={timelineQuery.isFetchingNextPage}
          onListNearBottom={loadMore}
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
}: {
  entries: UserTimelineItem[] | undefined
  error: boolean
  hasMore: boolean
  isFetchingMore: boolean
  onListNearBottom: () => Promise<unknown> | void
}) {
  const viewportRef = useRef<HTMLElement | null>(null)
  const loadingMoreRef = useRef(false)
  const rows = useMemo(() => (entries ? toTimelineRows(entries) : undefined), [entries])
  const itemCount = (rows?.length ?? 0) + (isFetchingMore ? APPEND_SKELETON_COUNT : 0)
  const requestMore = useCallback(() => {
    if (!hasMore || isFetchingMore || loadingMoreRef.current) return

    loadingMoreRef.current = true
    Promise.resolve(onListNearBottom()).finally(() => {
      loadingMoreRef.current = false
    })
  }, [hasMore, isFetchingMore, onListNearBottom])
  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ESTIMATED_TIMELINE_ITEM_HEIGHT,
    overscan: VIRTUAL_OVERSCAN,
    gap: 12,
    onChange: (instance) => {
      const lastItem = instance.getVirtualItems().at(-1)
      if (!lastItem || rows === undefined) return
      if (lastItem.index >= rows.length - LOAD_MORE_ROW_THRESHOLD) requestMore()
    },
  })
  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    virtualizer.measure()
  }, [rows?.length, virtualizer])

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
    <ScrollArea.Root className="group/scroll relative h-full min-h-0 overflow-hidden">
      <ScrollArea.Viewport
        className="h-full w-full overflow-x-hidden px-3 py-3 focus-visible:outline-hidden"
        ref={(node) => {
          viewportRef.current = node
        }}
      >
        <ScrollArea.Content className="w-full">
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index]

              return (
                <div
                  className="absolute top-0 right-0 left-0"
                  data-index={virtualItem.index}
                  key={row?.key ?? `skeleton-${virtualItem.index}`}
                  ref={virtualizer.measureElement}
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {row?.type === 'day' ? (
                    <UserTimelineDayHeader label={row.label} />
                  ) : row?.type === 'item' ? (
                    <UserTimelineItemCard compact expanded item={row.item} surface="plain" />
                  ) : (
                    <UserTimelineSkeletonItem />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
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
    <ScrollArea.Root className="group/scroll relative h-full w-full overflow-hidden">
      <ScrollArea.Viewport className="h-full w-full overflow-x-hidden px-3 py-3 focus-visible:outline-hidden">
        <ScrollArea.Content className="flex min-h-full w-full flex-col gap-3">
          {Array(count)
            .fill(undefined)
            .map((_, index) => (
              <UserTimelineSkeletonItem key={index} />
            ))}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
