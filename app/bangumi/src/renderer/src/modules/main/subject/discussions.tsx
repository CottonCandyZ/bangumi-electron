import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectTopicsQuery } from '@renderer/data/hooks/api/community'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import type { SubjectId } from '@renderer/data/types/bgm'
import type { CommunityTopic } from '@renderer/data/types/community'
import { cn } from '@renderer/lib/utils'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { useOpenMonoListPanelTab } from '@renderer/modules/panel/left-panel/use-open-mono-list-panel-tab'
import { type MonoListPanelTab } from '@renderer/state/panel'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'

const SUBJECT_DISCUSSIONS_PREVIEW_LIMIT = 6

export function SubjectDiscussions({
  className,
  subjectId,
}: {
  className?: string
  subjectId: SubjectId
}) {
  const [enabledSubjectId, setEnabledSubjectId] = useState<SubjectId | null>(null)
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subject = subjectInfoQuery.data
  const topicsQuery = useSubjectTopicsQuery({
    subjectId,
    subject,
    enabled: enabledSubjectId === subjectId && !subjectInfoQuery.isPending,
    limit: SUBJECT_DISCUSSIONS_PREVIEW_LIMIT,
  })
  const openMonoListPanelTab = useOpenMonoListPanelTab()
  const fetchedTopics = useMemo(
    () => topicsQuery.data?.pages.flatMap((page) => page.data),
    [topicsQuery.data],
  )
  const topics = useMemo(
    () => fetchedTopics?.slice(0, SUBJECT_DISCUSSIONS_PREVIEW_LIMIT),
    [fetchedTopics],
  )
  const total = topicsQuery.data?.pages[0]?.total
  const hasMore = total !== undefined && topics !== undefined && topics.length < total
  const sourceTitle = subject?.name_cn || subject?.name || `条目 ${subjectId}`
  const openInSidePanel = useCallback(() => {
    openMonoListPanelTab({
      id: `subject-topics-${subjectId}`,
      panelTitle: '条目讨论',
      sourceTitle,
      sourceTo: `/subject/${subjectId}`,
      subject,
      subjectId,
      title: '讨论',
      topics: topics ?? [],
      type: 'communitySubjectTopics',
    } satisfies MonoListPanelTab)
  }, [openMonoListPanelTab, sourceTitle, subject, subjectId, topics])
  const { ref, inView } = useInView({
    rootMargin: '240px 0px',
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView) setEnabledSubjectId(subjectId)
  }, [inView, subjectId])

  return (
    <section className={cn('flex min-w-0 flex-col gap-5', className)} ref={ref}>
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">讨论</h2>
          <Button
            className="mt-1 size-8"
            onClick={openInSidePanel}
            size="icon"
            title="在侧栏打开讨论"
            variant="ghost"
          >
            <span className="i-mingcute-box-3-line text-lg" />
          </Button>
        </div>
        {total !== undefined && <span className="text-muted-foreground text-sm">{total}</span>}
      </div>

      {topicsQuery.isError ? (
        <p className="text-muted-foreground text-sm">暂时无法读取讨论。</p>
      ) : topics === undefined ? (
        <SubjectDiscussionSkeletonList />
      ) : topics.length === 0 ? (
        <p className="text-muted-foreground text-sm">还没有讨论。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {topics.map((topic) => (
            <SubjectDiscussionItem key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button onClick={openInSidePanel} variant="outline">
            在侧栏查看更多 {topics.length}/{total}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function SubjectDiscussionItem({ topic }: { topic: CommunityTopic }) {
  const creatorAvatar = topic.creator?.avatar.medium || topic.creator?.avatar.small

  return (
    <MyLink
      className="hover:bg-accent flex min-h-20 cursor-default flex-row gap-3 rounded-md p-2 transition-colors"
      to={`/subject/topic/${topic.id}`}
    >
      {creatorAvatar ? (
        <Image
          className="size-10 shrink-0 overflow-hidden rounded-full"
          imageSrc={creatorAvatar}
          loading="eager"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
          <span className="i-mingcute-user-3-line text-lg" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{topic.title}</p>
        <div className="text-muted-foreground mt-1 flex flex-row flex-wrap items-center gap-1.5 text-xs">
          <span className="line-clamp-1">{topic.creator?.nickname ?? `#${topic.id}`}</span>
          <Badge className="h-5 rounded-sm px-1 text-[10px]" variant="outline">
            {topic.replyCount}
          </Badge>
          <span>{formatRecentUnixTime(topic.updatedAt)}</span>
        </div>
      </div>
    </MyLink>
  )
}

function SubjectDiscussionSkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="flex min-h-20 flex-row gap-3 rounded-md p-2" key={index}>
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
