import { Image } from '@renderer/components/image/image'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { useUserFriendsQuery } from '@renderer/data/hooks/api/relationship'
import type { UserTimelineSlimUser } from '@renderer/data/types/user'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { monoListPanelCenterActiveItemAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { isRoutePathActive, MonoListPanelFilters, PanelLinkItem, useIsRouteActive } from './shared'
import { useMonoListPanelRefreshAction } from './use-panel-refresh-action'

const USER_FRIENDS_PANEL_LIMIT = 20

export function UserFriendsListPanelContent({
  tab,
}: {
  tab: Extract<MonoListPanelTab, { type: 'userFriends' }>
}) {
  const { pathname } = useLocation()
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const query = useUserFriendsQuery({
    limit: USER_FRIENDS_PANEL_LIMIT,
    username: tab.username,
  })
  const users = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data])
  const total = query.data?.pages[0]?.total ?? tab.total
  const activeIndex = useMemo(
    () =>
      users.findIndex((user) =>
        isRoutePathActive(pathname, `/user/${encodeURIComponent(user.username)}`),
      ),
    [pathname, users],
  )

  useMonoListPanelRefreshAction({
    onRefresh: () => query.refetch(),
    refreshing: query.isFetching && !query.isFetchingNextPage,
    tabId: tab.id,
  })

  if (query.isLoading && users.length === 0) {
    return <UserFriendsPanelSkeleton />
  }
  if (query.isError && users.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-start gap-3 p-4 text-sm">
        <span>暂时无法读取好友列表。</span>
        <Button
          disabled={query.isFetching}
          onClick={() => query.refetch()}
          size="sm"
          variant="outline"
        >
          {query.isFetching ? '重试中' : '重试'}
        </Button>
      </div>
    )
  }

  return (
    <>
      <MonoListPanelFilters>
        <div className="text-muted-foreground flex w-full items-center justify-between gap-2 text-xs">
          <span>
            已加载 {users.length.toLocaleString()} / {total.toLocaleString()} 位好友
          </span>
          {query.isFetching && !query.isFetchingNextPage && <span>刷新中</span>}
        </div>
      </MonoListPanelFilters>
      <SingleColumnVirtualList
        activeIndex={centerActiveItem ? activeIndex : undefined}
        appendPlaceholderCount={USER_FRIENDS_PANEL_LIMIT}
        className="px-2 py-2"
        empty={<div className="text-muted-foreground p-4 text-sm">还没有好友。</div>}
        estimateSize={76}
        footer={
          query.isFetchNextPageError ? (
            <div className="text-muted-foreground flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>加载更多好友失败</span>
              <Button
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
                size="sm"
                variant="outline"
              >
                {query.isFetchingNextPage ? '重试中' : '重试'}
              </Button>
            </div>
          ) : undefined
        }
        gap={4}
        getKey={(user) => user.id}
        hasMore={!query.isFetchNextPageError && !!query.hasNextPage}
        isFetchingMore={query.isFetchingNextPage}
        items={users}
        onNearBottom={() => query.fetchNextPage()}
        renderItem={(user) => <UserFriendPanelItem user={user} />}
        renderPlaceholder={() => <UserFriendPanelSkeletonItem />}
        rootClassName="flex-1"
        scrollMemoryKey={`mono-list:${tab.id}`}
        showBackToTop
      />
    </>
  )
}

function UserFriendPanelItem({ user }: { user: UserTimelineSlimUser }) {
  const to = `/user/${encodeURIComponent(user.username)}`
  const active = useIsRouteActive(to)

  return (
    <PanelLinkItem active={active} to={to}>
      <Image
        className="size-12 shrink-0 overflow-hidden rounded-full"
        imageClassName="h-full w-full object-cover"
        imageSrc={user.avatar.medium}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="truncate text-sm font-medium">{user.nickname || user.username}</div>
        <div className="text-muted-foreground truncate text-xs">@{user.username}</div>
      </div>
    </PanelLinkItem>
  )
}

function UserFriendsPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 py-2">
      {Array.from({ length: 9 }, (_, index) => (
        <UserFriendPanelSkeletonItem key={index} />
      ))}
    </div>
  )
}

function UserFriendPanelSkeletonItem() {
  return (
    <div className="flex min-h-18 items-center gap-3 rounded-md p-2">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}
