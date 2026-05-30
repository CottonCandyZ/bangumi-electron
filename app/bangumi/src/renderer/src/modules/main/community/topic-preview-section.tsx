import { Image } from '@renderer/components/image/image'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { CommunityTopic } from '@renderer/data/types/community'
import { cn } from '@renderer/lib/utils'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import { LoginInlineAction } from '@renderer/modules/common/user/login/login-inline-action'
import { useOpenMonoListPanelTab } from '@renderer/modules/panel/left-panel/use-open-mono-list-panel-tab'
import { type MonoListPanelTab } from '@renderer/state/panel'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import type { CommunityOverviewSection, CommunityTopicQuery } from './types'

const PREVIEW_COUNT = 10

export function CommunityTopicSection({
  loginRequired = false,
  loginText,
  query,
  section,
}: {
  loginRequired?: boolean
  loginText?: string
  query: CommunityTopicQuery
  section: CommunityOverviewSection
}) {
  const topics = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <section className="flex min-h-[34rem] flex-col">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-xl font-medium">{section.title}</h2>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">{section.description}</p>
        </div>
        <OpenCommunityPanelButton
          disabled={topics.length === 0}
          onRefresh={() => query.refetch()}
          refreshing={query.isFetching && !query.isFetchingNextPage}
          section={section}
          topics={topics}
        />
      </div>
      <CommunityTopicPreviewList
        loginRequired={loginRequired}
        loginText={loginText}
        query={query}
        topics={topics}
      />
    </section>
  )
}

function CommunityTopicPreviewList({
  loginRequired,
  loginText,
  query,
  topics,
}: {
  loginRequired: boolean
  loginText?: string
  query: CommunityTopicQuery
  topics: CommunityTopic[]
}) {
  const previewTopics = topics.slice(0, PREVIEW_COUNT)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      {query.isError ? (
        <CommunitySectionMessage
          text="加载失败"
          action={
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              重试
            </Button>
          }
        />
      ) : loginRequired ? (
        <CommunitySectionMessage
          text={
            <>
              <LoginInlineAction />
              {loginText}
            </>
          }
        />
      ) : query.isLoading && previewTopics.length === 0 ? (
        Array.from({ length: PREVIEW_COUNT }).map((_, index) => (
          <CommunityPreviewSkeleton key={index} />
        ))
      ) : previewTopics.length === 0 ? (
        <CommunitySectionMessage text="暂无讨论" />
      ) : (
        previewTopics.map((topic) => <CommunityPreviewItem key={topic.route} topic={topic} />)
      )}
    </div>
  )
}

function OpenCommunityPanelButton({
  disabled,
  onRefresh,
  refreshing,
  section,
  topics,
}: {
  disabled: boolean
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
  section: CommunityOverviewSection
  topics: CommunityTopic[]
}) {
  const openMonoListPanelTab = useOpenMonoListPanelTab()

  return (
    <div className="flex shrink-0 items-center gap-1">
      <QueryRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
      <Button
        variant="ghost"
        size="sm"
        className="no-drag-region text-muted-foreground hover:text-foreground h-8 shrink-0 gap-1 px-2"
        disabled={disabled}
        onClick={() =>
          openMonoListPanelTab({
            groupMode: section.groupMode,
            id: section.id,
            panelTitle: section.panelTitle,
            sourceTitle: '讨论',
            sourceTo: '/talk',
            title: section.title,
            topicKind: section.topicKind,
            topics,
            type: 'communityTopics',
          } satisfies MonoListPanelTab)
        }
        title="在侧栏查看更多"
      >
        <span>查看更多</span>
        <span className="i-mingcute-right-line text-base" />
      </Button>
    </div>
  )
}

function CommunityPreviewItem({ topic }: { topic: CommunityTopic }) {
  const navigate = useNavigate()
  const to = getTopicRoute(topic)
  const sourceInternal = !!topic.source.route
  const openTopic = () => navigate(to)

  return (
    <article
      className="hover:bg-accent focus-visible:ring-ring/50 flex min-h-[4.75rem] cursor-default flex-row gap-3 rounded-md p-2 transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
      role="link"
      tabIndex={0}
      onClick={openTopic}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        openTopic()
      }}
    >
      <TopicSourceImage topic={topic} />
      <div className="min-w-0 flex-1">
        <Link
          className="line-clamp-1 w-fit max-w-full text-sm font-medium underline-offset-2 hover:underline"
          to={to}
          onClick={(event) => event.stopPropagation()}
        >
          {topic.title}
        </Link>
        <div className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="line-clamp-1 max-w-32">{topic.creator?.nickname ?? `#${topic.id}`}</span>
          <span>{formatRecentUnixTime(topic.updatedAt)}</span>
          <span>{topic.replyCount} 回复</span>
        </div>
        <div className="mt-1 min-w-0">
          {sourceInternal ? (
            <Link
              className="text-primary line-clamp-1 w-fit max-w-full text-xs underline-offset-2 hover:underline"
              to={topic.source.route}
              onClick={(event) => event.stopPropagation()}
            >
              {topic.source.title}
            </Link>
          ) : (
            <span className="text-primary line-clamp-1 w-fit max-w-full text-xs">
              {topic.source.title}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function TopicSourceImage({ topic }: { topic: CommunityTopic }) {
  if (topic.source.image) {
    return (
      <Image
        className="bg-muted size-10 shrink-0 overflow-hidden rounded-md"
        imageSrc={topic.source.image}
        loading="eager"
      />
    )
  }

  const icon = topic.kind === 'group' ? 'i-mingcute-group-3-line' : 'i-mingcute-book-6-line'

  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md',
        topic.kind === 'trending-subject' && 'text-primary',
      )}
    >
      <span className={`${icon} text-xl`} />
    </div>
  )
}

function CommunityPreviewSkeleton() {
  return (
    <div className="flex min-h-[4.75rem] flex-row gap-3 rounded-md p-2">
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function CommunitySectionMessage({ action, text }: { action?: ReactNode; text: ReactNode }) {
  return (
    <div className="border-border bg-muted/30 flex min-h-40 flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-sm">
      <span className="text-muted-foreground">{text}</span>
      {action}
    </div>
  )
}

function getTopicRoute(topic: CommunityTopic) {
  return topic.kind === 'group' ? `/group/topic/${topic.id}` : `/subject/topic/${topic.id}`
}
