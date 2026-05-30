import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import {
  useGroupTopicsQuery,
  useRecentGroupTopicsQuery,
  useRecentSubjectTopicsQuery,
  useTrendingSubjectTopicsQuery,
} from '@renderer/data/hooks/api/community'
import type { CommunityTopic } from '@renderer/data/types/community'
import { cn } from '@renderer/lib/utils'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import type { CommunityTopicQuery } from './community-types'
import { isRoutePathActive, useActivePanelItemRef } from './shared'

export function CommunityTopicsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityTopics' }>
}) {
  if (tab.topicKind === 'group') return <GroupCommunityTopicsListPanelContent tab={tab} />
  if (tab.topicKind === 'subject') return <SubjectCommunityTopicsListPanelContent tab={tab} />
  return <TrendingCommunityTopicsListPanelContent tab={tab} />
}

export function CommunityGroupTopicsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityGroupTopics' }>
}) {
  const query = useGroupTopicsQuery({
    groupName: tab.groupName,
    group: tab.group,
    limit: 24,
  })
  return <CommunityTopicsVirtualList tab={tab} query={query} />
}

function GroupCommunityTopicsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityTopics' }>
}) {
  const query = useRecentGroupTopicsQuery({ mode: tab.groupMode ?? 'all', limit: 24 })
  return <CommunityTopicsVirtualList tab={tab} query={query} />
}

function SubjectCommunityTopicsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityTopics' }>
}) {
  const query = useRecentSubjectTopicsQuery({ limit: 24 })
  return <CommunityTopicsVirtualList tab={tab} query={query} />
}

function TrendingCommunityTopicsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityTopics' }>
}) {
  const query = useTrendingSubjectTopicsQuery({ limit: 24 })
  return <CommunityTopicsVirtualList tab={tab} query={query} />
}

function CommunityTopicsVirtualList({
  query,
  tab,
}: {
  query: CommunityTopicQuery
  tab: Extract<MonoListPanelTab, { type: 'communityGroupTopics' | 'communityTopics' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const topics = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? tab.topics,
    [query.data, tab.topics],
  )
  const activeIndex = useMemo(
    () => topics.findIndex((topic) => isRoutePathActive(pathname, getCommunityTopicRoute(topic))),
    [pathname, topics],
  )

  if (query.isLoading && topics.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 py-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <CommunityTopicPanelItemSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <SingleColumnVirtualList
      items={topics}
      getKey={(topic) => `${topic.kind}-${topic.id}`}
      renderItem={(topic) => <CommunityTopicPanelItem topic={topic} />}
      activeIndex={centerActiveItem ? activeIndex : undefined}
      empty={<div className="text-muted-foreground p-4 text-sm">没有讨论。</div>}
      rootClassName="flex-1"
      className="px-2 py-2"
      estimateSize={96}
      gap={4}
      hasMore={!query.isError && !!query.hasNextPage}
      isFetchingMore={query.isFetchingNextPage}
      onNearBottom={() => query.fetchNextPage()}
      renderPlaceholder={() => <CommunityTopicPanelItemSkeleton />}
      scrollAreaKey={`mono-list:${tab.id}`}
      showBackToTop
    />
  )
}

function CommunityTopicPanelItem({ topic }: { topic: CommunityTopic }) {
  const to = getCommunityTopicRoute(topic)
  const active = isRoutePathActive(useLocation().pathname, to)
  const ref = useActivePanelItemRef(active)

  return (
    <div ref={ref}>
      <MyLink
        className={cn(
          'hover:bg-accent data-[active=true]:bg-accent flex min-h-20 cursor-default flex-row gap-2 rounded-md p-2',
        )}
        data-active={active}
        to={to}
        onClick={(event) => {
          if (active) event.preventDefault()
        }}
      >
        {topic.source.image ? (
          <Image
            className="size-12 shrink-0 overflow-hidden rounded-md"
            imageSrc={topic.source.image}
            loading="eager"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md">
            <span className="i-mingcute-chat-3-line text-xl" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium">{topic.title}</p>
          <div className="text-muted-foreground mt-1 flex flex-row flex-wrap items-center gap-1.5 text-xs">
            <span className="line-clamp-1">{topic.source.title}</span>
            <Badge variant="outline" className="h-5 rounded-sm px-1 text-[10px]">
              {topic.replyCount}
            </Badge>
            <span>{formatRecentUnixTime(topic.updatedAt)}</span>
          </div>
        </div>
      </MyLink>
    </div>
  )
}

function CommunityTopicPanelItemSkeleton() {
  return (
    <div className="flex min-h-20 flex-row gap-2 rounded-md p-2">
      <Skeleton className="size-12 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function getCommunityTopicRoute(topic: CommunityTopic) {
  return topic.kind === 'group' ? `/group/topic/${topic.id}` : `/subject/topic/${topic.id}`
}
