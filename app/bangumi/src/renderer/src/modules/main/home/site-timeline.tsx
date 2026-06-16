import { Tabs } from '@renderer/components/tabs'
import { Button } from '@renderer/components/ui/button'
import { useTimelineQuery } from '@renderer/data/hooks/api/timeline'
import {
  hasUserTimelineItemDetails,
  UserTimelineItemCard,
  UserTimelineSkeleton,
} from '@renderer/modules/common/user/timeline'
import { homeSiteTimelineModeAtom, type MonoListPanelTab } from '@renderer/state/panel'
import { useMonoListPanelOpenHandler } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { useAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

import { TimelineRefreshButton } from './timeline-refresh-button'

const TIMELINE_MODE_TABS = new Set(['全站', '关注'])
const TIMELINE_PREVIEW_ITEM_LIMIT = 3

export function SiteTimelinePreview() {
  const [mode, setMode] = useAtom(homeSiteTimelineModeAtom)
  const selectedTab = mode === 'friends' ? '关注' : '全站'
  const query = useTimelineQuery({ mode, limit: 8 })
  const refetchTimelineRef = useRef(query.refetch)
  const refreshAfterModeChangeRef = useRef(false)
  const [now, setNow] = useState(() => Date.now())
  const visibleItems = query.data?.filter(hasUserTimelineItemDetails).slice(0, 6)
  const panelTab = {
    id: 'site-timeline',
    mode,
    panelTitle: '时间线',
    sourceTitle: '首页',
    sourceTo: '/',
    title: '时间线',
    type: 'siteTimeline',
  } satisfies MonoListPanelTab
  const openPanel = useMonoListPanelOpenHandler(panelTab)

  useEffect(() => {
    refetchTimelineRef.current = query.refetch
  }, [query.refetch])

  useEffect(() => {
    if (!refreshAfterModeChangeRef.current) {
      return
    }

    refreshAfterModeChangeRef.current = false
    refetchTimelineRef.current()
  }, [mode])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30 * 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="flex h-full min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="text-xl font-semibold">时间线</h2>
            <Tabs
              className="min-h-8 shrink-0 p-0.5"
              currentSelect={selectedTab}
              layoutId="home-site-timeline-mode"
              setCurrentSelect={(_, value) => {
                const nextMode = value === '关注' ? 'friends' : 'all'
                if (nextMode === mode) return

                refreshAfterModeChangeRef.current = true
                setMode(nextMode)
              }}
              tabsContent={TIMELINE_MODE_TABS}
            />
          </div>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
            {mode === 'friends' ? '关注用户的最新动态' : '全站最新动态'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TimelineRefreshButton
            lastRefreshedAt={query.dataUpdatedAt}
            now={now}
            onRefresh={() => {
              setNow(Date.now())
              query.refetch()
            }}
            refreshing={query.isFetching}
          />
          <Button
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            onClick={openPanel}
            size="sm"
            title="在侧栏打开"
            variant="ghost"
          >
            查看更多
            <span className="i-mingcute-right-line text-base" />
          </Button>
        </div>
      </div>
      {query.isError ? (
        <p className="text-muted-foreground text-sm">暂时无法读取时间线。</p>
      ) : query.isLoading || !visibleItems ? (
        <UserTimelineSkeleton count={6} showUser surface="timeline" />
      ) : visibleItems.length === 0 ? (
        <p className="text-muted-foreground text-sm">近期没有动态。</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {visibleItems.map((item) => (
            <UserTimelineItemCard
              compact
              item={item}
              key={item.id}
              previewItemLimit={TIMELINE_PREVIEW_ITEM_LIMIT}
              showUser
              surface="timeline"
            />
          ))}
        </div>
      )}
    </section>
  )
}
