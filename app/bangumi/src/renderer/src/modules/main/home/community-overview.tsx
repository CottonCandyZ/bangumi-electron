import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  useRecentGroupTopicsQuery,
  useTrendingSubjectTopicsQuery,
} from '@renderer/data/hooks/api/community'
import { useSession } from '@renderer/data/hooks/session'
import type { CommunityTopic, CommunityTopicKind } from '@renderer/data/types/community'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import { LoginInlineAction } from '@renderer/modules/common/user/login/login-inline-action'
import { useOpenMonoListPanelTab } from '@renderer/modules/panel/left-panel/use-open-mono-list-panel-tab'
import { type MonoListPanelTab } from '@renderer/state/panel'

const PREVIEW_LIMIT = 5

type HomeTopicSectionConfig = {
  description: string
  groupMode?: 'joined'
  id: string
  panelTitle: string
  title: string
  topicKind: CommunityTopicKind
}

export function HomeJoinedGroupsPreview() {
  const session = useSession()
  const joinedTopicsQuery = useRecentGroupTopicsQuery({
    mode: 'joined',
    limit: 12,
    enabled: !!session,
  })

  return (
    <HomeTopicSection
      emptyText="近期没有小组讨论"
      loginRequired={!session}
      loginText="后显示加入小组的讨论"
      onRefresh={() => joinedTopicsQuery.refetch()}
      queryError={joinedTopicsQuery.isError}
      queryLoading={joinedTopicsQuery.isLoading}
      refreshDisabled={!session}
      refreshing={joinedTopicsQuery.isFetching && !joinedTopicsQuery.isFetchingNextPage}
      section={{
        description: '你加入的小组里的新回复',
        groupMode: 'joined',
        id: 'home-joined-groups',
        panelTitle: '我的小组',
        title: '我的小组',
        topicKind: 'group',
      }}
      topics={joinedTopicsQuery.data?.pages.flatMap((page) => page.data) ?? []}
    />
  )
}

export function HomeTrendingSubjectTopicsPreview() {
  const trendingTopicsQuery = useTrendingSubjectTopicsQuery({ limit: 12 })

  return (
    <HomeTopicSection
      emptyText="近期没有热门条目讨论"
      onRefresh={() => trendingTopicsQuery.refetch()}
      queryError={trendingTopicsQuery.isError}
      queryLoading={trendingTopicsQuery.isLoading}
      refreshing={trendingTopicsQuery.isFetching && !trendingTopicsQuery.isFetchingNextPage}
      section={{
        description: '站内正在热聊的条目帖子',
        id: 'home-trending-subject-topics',
        panelTitle: '热门条目讨论',
        title: '热门条目讨论',
        topicKind: 'trending-subject',
      }}
      topics={trendingTopicsQuery.data?.pages.flatMap((page) => page.data) ?? []}
    />
  )
}

function HomeTopicSection({
  emptyText,
  loginRequired = false,
  loginText,
  onRefresh,
  queryError,
  queryLoading,
  refreshDisabled,
  refreshing,
  section,
  topics,
}: {
  emptyText: string
  loginRequired?: boolean
  loginText?: string
  onRefresh: () => Promise<unknown> | unknown
  queryError: boolean
  queryLoading: boolean
  refreshDisabled?: boolean
  refreshing: boolean
  section: HomeTopicSectionConfig
  topics: CommunityTopic[]
}) {
  const openMonoListPanelTab = useOpenMonoListPanelTab()
  const previewTopics = topics.slice(0, PREVIEW_LIMIT)

  return (
    <section className="flex min-h-72 min-w-0 flex-col">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-xl font-semibold">{section.title}</h2>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">{section.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <QueryRefreshButton
            disabled={refreshDisabled}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
          <Button
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            disabled={topics.length === 0}
            onClick={() =>
              openMonoListPanelTab({
                groupMode: section.groupMode,
                id: section.id,
                panelTitle: section.panelTitle,
                sourceTitle: '首页',
                sourceTo: '/',
                title: section.title,
                topicKind: section.topicKind,
                topics,
                type: 'communityTopics',
              } satisfies MonoListPanelTab)
            }
            size="sm"
            variant="ghost"
          >
            查看更多
            <span className="i-mingcute-right-line text-base" />
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {queryError ? (
          <p className="text-muted-foreground p-2 text-sm">加载失败</p>
        ) : loginRequired ? (
          <p className="text-muted-foreground p-2 text-sm">
            <LoginInlineAction />
            {loginText}
          </p>
        ) : queryLoading && previewTopics.length === 0 ? (
          Array.from({ length: PREVIEW_LIMIT }).map((_, index) => <HomeTopicSkeleton key={index} />)
        ) : previewTopics.length === 0 ? (
          <p className="text-muted-foreground p-2 text-sm">{emptyText}</p>
        ) : (
          previewTopics.map((topic) => <HomeTopicItem key={topic.route} topic={topic} />)
        )}
      </div>
    </section>
  )
}

function HomeTopicItem({ topic }: { topic: CommunityTopic }) {
  const sourceTo = topic.kind === 'group' ? undefined : topic.source.route

  return (
    <MyLink
      className="hover:bg-accent flex min-w-0 gap-2 rounded-md p-2 transition-colors"
      to={topic.route}
    >
      {topic.source.image ? (
        <Image
          className="size-10 shrink-0 overflow-hidden rounded-md border"
          imageSrc={topic.source.image}
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
          <span className="i-mingcute-chat-3-line text-lg" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-medium">{topic.title}</div>
        <div className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="line-clamp-1 max-w-28">{topic.creator?.nickname ?? `#${topic.id}`}</span>
          <span>{topic.replyCount} 回复</span>
          <span>{formatRecentUnixTime(topic.updatedAt)}</span>
        </div>
        <div className="text-primary mt-0.5 line-clamp-1 text-xs">
          {sourceTo ? <span>{topic.source.title}</span> : topic.source.title}
        </div>
      </div>
    </MyLink>
  )
}

function HomeTopicSkeleton() {
  return (
    <div className="flex min-w-0 gap-2 rounded-md p-2">
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}
