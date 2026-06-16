import { Image } from '@renderer/components/image/image'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { SlimGroup } from '@renderer/data/types/community'
import { OpenGroupTopicsPanelButton } from '@renderer/modules/common/community/open-group-topics-panel-button'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import { LoginInlineAction } from '@renderer/modules/common/user/login/login-inline-action'
import { useMonoListPanelOpenHandler } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { type MonoListPanelTab } from '@renderer/state/panel'
import { Link } from 'react-router-dom'

export function GroupsSection({
  emptyText,
  groups,
  listKind,
  loginText,
  loading,
  onRefresh,
  panelTitle,
  previewLimit,
  refreshDisabled,
  refreshing,
  signedIn,
  sort,
  sourceTitle,
  sourceTo,
  title,
  username,
}: {
  emptyText: string
  groups: SlimGroup[]
  listKind: 'all' | 'user'
  loginText?: string
  loading: boolean
  onRefresh: () => Promise<unknown> | unknown
  panelTitle: string
  previewLimit?: number
  refreshDisabled?: boolean
  refreshing: boolean
  signedIn: boolean
  sort?: 'posts' | 'topics' | 'members' | 'created' | 'updated'
  sourceTitle: string
  sourceTo: string
  title: string
  username?: string
}) {
  const previewGroups = previewLimit ? groups.slice(0, previewLimit) : groups
  const panelTab = {
    groups,
    id: listKind === 'user' ? `groups-user-${username}` : `groups-${sort ?? 'members'}`,
    listKind,
    panelTitle,
    sort,
    sourceTitle,
    sourceTo,
    title,
    type: 'communityGroups',
    username,
  } satisfies MonoListPanelTab
  const openPanel = useMonoListPanelOpenHandler(panelTab)

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-medium">{title}</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {listKind === 'user' ? '你加入的小组' : '成员数最多的小组'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <QueryRefreshButton
            disabled={refreshDisabled}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
          <Button
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            disabled={groups.length === 0}
            onClick={openPanel}
            size="sm"
            variant="ghost"
          >
            查看更多
            <span className="i-mingcute-right-line text-base" />
          </Button>
        </div>
      </div>
      {!signedIn ? (
        <p className="text-muted-foreground text-sm">
          <LoginInlineAction />
          {loginText}
        </p>
      ) : loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <JoinedGroupSkeleton key={index} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2">
          {previewGroups.map((group) => (
            <JoinedGroupItem group={group} key={group.id} />
          ))}
        </div>
      )}
    </section>
  )
}

function JoinedGroupItem({ group }: { group: SlimGroup }) {
  return (
    <div className="hover:bg-accent flex min-w-0 items-center gap-1 rounded-md border p-1 transition-colors">
      <Link
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1"
        to={`/group/${group.name}`}
      >
        {group.icon?.medium || group.icon?.small ? (
          <Image
            className="size-10 shrink-0 overflow-hidden rounded-md"
            imageSrc={group.icon.medium || group.icon.small}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
            <span className="i-mingcute-group-3-line text-lg" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-sm font-medium">{group.title || group.name}</div>
          <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
            {group.members} 成员
          </div>
        </div>
      </Link>
      <OpenGroupTopicsPanelButton
        className="text-muted-foreground hover:text-foreground"
        group={group}
      />
    </div>
  )
}

function JoinedGroupSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border p-2">
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}
