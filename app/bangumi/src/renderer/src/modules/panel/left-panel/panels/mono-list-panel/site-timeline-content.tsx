import { Tabs } from '@renderer/components/tabs'
import { Button } from '@renderer/components/ui/button'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useTimelineInfiniteQuery } from '@renderer/data/hooks/api/timeline'
import type { UserTimelineItem } from '@renderer/data/types/user'
import {
  hasUserTimelineItemDetails,
  UserTimelineItemCard,
  UserTimelineSkeletonItem,
} from '@renderer/modules/common/user/timeline'
import { cn } from '@renderer/lib/utils'
import { monoListSiteTimelineModeAtom, type MonoListPanelTab } from '@renderer/state/panel'
import dayjs from 'dayjs'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SITE_TIMELINE_PAGE_LIMIT = 20
const ESTIMATED_TIMELINE_ITEM_HEIGHT = 156
const APPEND_SKELETON_COUNT = 4
const LOAD_MORE_ROW_THRESHOLD = 6
const TIMELINE_MODE_TABS = new Set(['全站', '关注'])

type SiteTimelineRow =
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

export function SiteTimelineListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'siteTimeline' }>
}) {
  const [mode, setMode] = useAtom(monoListSiteTimelineModeAtom)
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0)
  const selectedTab = mode === 'friends' ? '关注' : '全站'
  const timelineQuery = useTimelineInfiniteQuery({ mode, limit: SITE_TIMELINE_PAGE_LIMIT })
  const refreshFirstPage = timelineQuery.refreshFirstPage
  const mountedRef = useRef(false)
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
    return refreshFirstPage()
  }, [refreshFirstPage])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    refreshFirstPage()
  }, [mode, refreshFirstPage])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border/70 shrink-0 border-b px-3 py-2">
        <div className="flex min-w-0 flex-row items-center justify-between gap-2">
          <Tabs
            className="min-h-8 p-0.5"
            currentSelect={selectedTab}
            layoutId={`mono-list-${tab.id}-mode`}
            setCurrentSelect={(_, value) => setMode(value === '关注' ? 'friends' : 'all')}
            tabsContent={TIMELINE_MODE_TABS}
          />
          <Button
            className="size-8 shrink-0"
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
      </div>
      <SiteTimelineVirtualList
        entries={entries}
        error={timelineQuery.isError}
        hasMore={!!timelineQuery.hasNextPage}
        isFetchingMore={timelineQuery.isFetchingNextPage}
        onListNearBottom={loadMore}
        scrollAreaKey={`mono-list:${tab.id}:${mode}`}
        scrollToTopSignal={scrollToTopSignal}
      />
    </div>
  )
}

function SiteTimelineVirtualList({
  entries,
  error,
  hasMore,
  isFetchingMore,
  onListNearBottom,
  scrollAreaKey,
  scrollToTopSignal,
}: {
  entries: UserTimelineItem[] | undefined
  error: boolean
  hasMore: boolean
  isFetchingMore: boolean
  onListNearBottom: () => Promise<unknown> | void
  scrollAreaKey: string
  scrollToTopSignal: number
}) {
  const rows = useMemo(() => (entries ? toTimelineRows(entries) : undefined), [entries])
  const requestMore = useCallback(() => {
    if (!hasMore || isFetchingMore) return

    return onListNearBottom()
  }, [hasMore, isFetchingMore, onListNearBottom])

  if (rows === undefined && !error) {
    return <SiteTimelineSkeletonScroll count={8} />
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
          <SiteTimelineDayHeader label={row.label} />
        ) : (
          <UserTimelineItemCard compact expanded item={row.item} showUser surface="timeline" />
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
      renderPlaceholder={() => <UserTimelineSkeletonItem showUser surface="timeline" />}
      rootClassName="min-h-0 flex-1"
      scrollAreaKey={scrollAreaKey}
      scrollToTopSignal={scrollToTopSignal}
      showBackToTop
    />
  )
}

function toTimelineRows(entries: UserTimelineItem[]) {
  const rows: SiteTimelineRow[] = []
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

function SiteTimelineDayHeader({ label }: { label: string }) {
  return (
    <div className="bg-background/95 sticky top-0 z-10 flex items-center gap-2 py-2 text-xs font-medium backdrop-blur">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="bg-border h-px min-w-0 flex-1" />
    </div>
  )
}

function SiteTimelineSkeletonScroll({ count }: { count: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 py-3">
      {Array.from({ length: count }).map((_, index) => (
        <UserTimelineSkeletonItem key={index} showUser surface="timeline" />
      ))}
    </div>
  )
}
