import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Button } from '@renderer/components/ui/button'
import {
  useGroupByNameQuery,
  useGroupMembersQuery,
  useGroupTopicsQuery,
} from '@renderer/data/hooks/api/community'
import { OpenGroupTopicsPanelButton } from '@renderer/modules/common/community/open-group-topics-panel-button'

import { GroupHeader } from './header'
import { GroupMembersPreview } from './members-preview'
import { GroupTopicsVirtualList } from './topics-list'

const GROUP_MEMBER_PREVIEW_LIMIT = 10
const GROUP_TOPIC_PAGE_LIMIT = 24

export function GroupHome({ groupName }: { groupName: string | undefined }) {
  const groupQuery = useGroupByNameQuery({ groupName, enabled: !!groupName })
  const group = groupQuery.data
  const membersQuery = useGroupMembersQuery({
    groupName,
    limit: GROUP_MEMBER_PREVIEW_LIMIT,
    enabled: !!groupName && !!group,
  })
  const topicsQuery = useGroupTopicsQuery({
    groupName,
    group,
    limit: GROUP_TOPIC_PAGE_LIMIT,
    enabled: !!groupName && !!group,
  })
  const topics = topicsQuery.data?.pages.flatMap((page) => page.data) ?? []

  usePageScrollRestoreReady(
    (!groupQuery.isLoading || groupQuery.isError) &&
      (!membersQuery.isLoading || membersQuery.isError) &&
      (!topicsQuery.isLoading || topicsQuery.isError),
  )

  if (!groupName) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">没有找到小组。</p>
      </div>
    )
  }

  if (groupQuery.isError) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm">暂时无法读取小组。</p>
          <Button variant="outline" size="sm" onClick={() => groupQuery.refetch()}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-8 pt-6 pb-5">
        <GroupHeader group={group} loading={groupQuery.isLoading} />
      </div>
      <div className="flex min-h-0 flex-1 gap-6 px-8">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-xl font-medium">小组话题</h2>
              {group && <OpenGroupTopicsPanelButton group={group} />}
            </div>
          </div>
          <GroupTopicsVirtualList
            error={topicsQuery.isError}
            hasMore={!!topicsQuery.hasNextPage}
            isFetchingMore={topicsQuery.isFetchingNextPage}
            loading={topicsQuery.isLoading}
            onNearBottom={() => topicsQuery.fetchNextPage()}
            topics={topics}
            scrollAreaKey={`group-topics:${groupName}`}
          />
        </section>
        <GroupMembersPreview
          error={membersQuery.isError}
          loading={membersQuery.isLoading}
          members={membersQuery.data?.pages.flatMap((page) => page.data) ?? []}
        />
      </div>
    </div>
  )
}
