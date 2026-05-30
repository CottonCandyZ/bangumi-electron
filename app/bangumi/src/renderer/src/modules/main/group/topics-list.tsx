import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import type { CommunityTopic } from '@renderer/data/types/community'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'

export function GroupTopicsVirtualList({
  error,
  hasMore,
  isFetchingMore,
  loading,
  onNearBottom,
  scrollAreaKey,
  topics,
}: {
  error: boolean
  hasMore: boolean
  isFetchingMore: boolean
  loading: boolean
  onNearBottom: () => Promise<unknown> | void
  scrollAreaKey: string
  topics: CommunityTopic[]
}) {
  if (loading && topics.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        {Array.from({ length: 8 }).map((_, index) => (
          <GroupTopicSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-muted-foreground p-4 text-sm">暂时无法读取话题。</p>
  }

  return (
    <SingleColumnVirtualList
      className="py-1"
      empty={<p className="text-muted-foreground p-4 text-sm">还没有话题。</p>}
      estimateSize={92}
      gap={4}
      getKey={(topic) => topic.id}
      hasMore={hasMore}
      isFetchingMore={isFetchingMore}
      items={topics}
      onNearBottom={onNearBottom}
      renderItem={(topic) => <GroupTopicItem topic={topic} />}
      renderPlaceholder={() => <GroupTopicSkeleton />}
      rootClassName="flex-1"
      scrollAreaKey={scrollAreaKey}
      showBackToTop
    />
  )
}

function GroupTopicItem({ topic }: { topic: CommunityTopic }) {
  return (
    <MyLink
      className="hover:bg-accent flex min-h-20 cursor-default gap-3 rounded-md p-2 transition-colors"
      to={`/group/topic/${topic.id}`}
    >
      <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md">
        <span className="i-mingcute-chat-3-line text-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-medium">{topic.title}</div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="line-clamp-1 max-w-36">{topic.creator?.nickname ?? `#${topic.id}`}</span>
          <span>{formatRecentUnixTime(topic.updatedAt)}</span>
          <span>{topic.replyCount} 回复</span>
        </div>
      </div>
    </MyLink>
  )
}

function GroupTopicSkeleton() {
  return (
    <div className="flex min-h-20 gap-3 rounded-md p-2">
      <Skeleton className="size-12 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}
