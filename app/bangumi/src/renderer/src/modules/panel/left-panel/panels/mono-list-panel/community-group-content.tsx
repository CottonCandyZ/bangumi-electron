import { Image } from '@renderer/components/image/image'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useGroupsQuery, useUserGroupsQuery } from '@renderer/data/hooks/api/community'
import type { SlimGroup } from '@renderer/data/types/community'
import { OpenGroupTopicsPanelButton } from '@renderer/modules/common/community/open-group-topics-panel-button'
import { monoListPanelCenterActiveItemAtom, type MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import type { CommunityGroupQuery } from './community-types'
import { isRoutePathActive, useActivePanelItemRef } from './shared'
import { useMonoListPanelRefreshAction } from './use-panel-refresh-action'

export function CommunityGroupsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityGroups' }>
}) {
  if (tab.listKind === 'user') return <UserCommunityGroupsListPanelContent tab={tab} />
  return <AllCommunityGroupsListPanelContent tab={tab} />
}

function UserCommunityGroupsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityGroups' }>
}) {
  const query = useUserGroupsQuery({ username: tab.username, limit: 24, enabled: !!tab.username })
  return <CommunityGroupsVirtualList tab={tab} query={query} />
}

function AllCommunityGroupsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'communityGroups' }>
}) {
  const query = useGroupsQuery({ sort: tab.sort ?? 'members', limit: 24 })
  return <CommunityGroupsVirtualList tab={tab} query={query} />
}

function CommunityGroupsVirtualList({
  query,
  tab,
}: {
  query: CommunityGroupQuery
  tab: Extract<MonoListPanelTab, { type: 'communityGroups' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const groups = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? tab.groups,
    [query.data, tab.groups],
  )
  const activeIndex = useMemo(
    () => groups.findIndex((group) => isRoutePathActive(pathname, `/group/${group.name}`)),
    [groups, pathname],
  )
  useMonoListPanelRefreshAction({
    onRefresh: () => query.refetch(),
    refreshing: query.isFetching && !query.isFetchingNextPage,
    tabId: tab.id,
  })

  if (query.isLoading && groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 py-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <CommunityGroupPanelItemSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <SingleColumnVirtualList
      items={groups}
      getKey={(group) => group.id}
      renderItem={(group) => <CommunityGroupPanelItem group={group} />}
      activeIndex={centerActiveItem ? activeIndex : undefined}
      empty={<div className="text-muted-foreground p-4 text-sm">没有小组。</div>}
      rootClassName="flex-1"
      className="px-2 py-2"
      estimateSize={76}
      gap={4}
      hasMore={!query.isError && !!query.hasNextPage}
      isFetchingMore={query.isFetchingNextPage}
      onNearBottom={() => query.fetchNextPage()}
      renderPlaceholder={() => <CommunityGroupPanelItemSkeleton />}
      scrollAreaKey={`mono-list:${tab.id}`}
      showBackToTop
    />
  )
}

function CommunityGroupPanelItem({ group }: { group: SlimGroup }) {
  const to = `/group/${group.name}`
  const active = isRoutePathActive(useLocation().pathname, to)
  const navigate = useNavigate()
  const ref = useActivePanelItemRef(active)
  const openGroup = () => {
    if (!active) navigate(to)
  }

  return (
    <div
      className="hover:bg-accent data-[active=true]:bg-accent flex min-h-18 cursor-default flex-row items-center gap-2 rounded-md p-2"
      data-active={active}
      ref={ref}
      role="link"
      tabIndex={0}
      onClick={openGroup}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        openGroup()
      }}
    >
      {group.icon?.medium || group.icon?.small ? (
        <Image
          className="size-12 shrink-0 overflow-hidden rounded-md"
          imageSrc={group.icon.medium || group.icon.small}
          loading="eager"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md">
          <span className="i-mingcute-group-3-line text-xl" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">{group.title || group.name}</p>
        <div className="text-muted-foreground mt-1 flex flex-row flex-wrap items-center gap-1.5 text-xs">
          <span className="line-clamp-1">{group.name}</span>
          <Badge variant="outline" className="h-5 rounded-sm px-1 text-[10px]">
            {group.members}
          </Badge>
        </div>
      </div>
      <OpenGroupTopicsPanelButton
        className="text-muted-foreground hover:text-foreground"
        group={group}
      />
    </div>
  )
}

function CommunityGroupPanelItemSkeleton() {
  return (
    <div className="flex min-h-18 flex-row gap-2 rounded-md p-2">
      <Skeleton className="size-12 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
