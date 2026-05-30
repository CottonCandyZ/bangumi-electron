import { CommentItem, CommentSkeleton } from '@renderer/components/comment/comment-box'
import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useNativeSmoothVirtualizerScrollToTop } from '@renderer/components/virtual/use-native-smooth-virtualizer-scroll-to-top'
import { useVirtualScrollMemory } from '@renderer/components/virtual/use-virtual-scroll-memory'
import { useGroupTopicQuery, useSubjectTopicQuery } from '@renderer/data/hooks/api/community'
import { Comment } from '@renderer/data/types/comment'
import { GroupTopic, SubjectTopic, TopicReply } from '@renderer/data/types/community'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { MainBackToTopButton } from '@renderer/modules/main/back-to-top-button'
import { communityTopicTitleInViewAtom } from '@renderer/state/in-view'
import { scrollViewportAtom } from '@renderer/state/scroll'
import dayjs from 'dayjs'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { Virtualizer } from 'virtua'
import type { VirtualizerHandle } from 'virtua'

type TopicKind = 'group' | 'subject'

const TOPIC_DETAIL_ITEM_ESTIMATE = 148
const TOPIC_DETAIL_OVERSCAN = 8

export function CommunityTopicDetail({ kind, topicId }: { kind: TopicKind; topicId: number }) {
  if (!Number.isFinite(topicId)) {
    return <TopicDetailMessage text="话题 ID 无效。" />
  }

  return kind === 'group' ? (
    <GroupTopicDetail topicId={topicId} />
  ) : (
    <SubjectTopicDetail topicId={topicId} />
  )
}

function GroupTopicDetail({ topicId }: { topicId: number }) {
  const query = useGroupTopicQuery({ topicId })

  if (query.isLoading) return <TopicDetailSkeleton />
  if (query.isError || !query.data) return <TopicDetailMessage text="暂时无法读取小组话题。" />

  return <TopicDetail topic={query.data} kind="group" />
}

function SubjectTopicDetail({ topicId }: { topicId: number }) {
  const query = useSubjectTopicQuery({ topicId })

  if (query.isLoading) return <TopicDetailSkeleton />
  if (query.isError || !query.data) return <TopicDetailMessage text="暂时无法读取条目讨论。" />

  return <TopicDetail topic={query.data} kind="subject" />
}

function TopicDetail({ topic, kind }: { topic: GroupTopic | SubjectTopic; kind: TopicKind }) {
  const scrollViewport = useAtomValue(scrollViewportAtom)
  const scrollRef = useRef<HTMLElement | null>(null)
  const virtualizerRef = useRef<VirtualizerHandle>(null)
  scrollRef.current = scrollViewport
  const rows = useMemo(() => getTopicRows(topic), [topic])
  const virtualScrollKey = `${kind}-topic-page:${topic.id}`
  const {
    cache: restoredVirtualCache,
    mountKey: virtualizerMountKey,
    saveScrollState: saveVirtualScrollState,
  } = useVirtualScrollMemory({
    itemCount: rows.length,
    ready: true,
    scrollKey: virtualScrollKey,
    viewport: scrollViewport,
    viewportRef: scrollRef,
    virtualizerRef,
  })
  const scrollToTop = useNativeSmoothVirtualizerScrollToTop({
    saveScrollState: saveVirtualScrollState,
    viewport: scrollViewport,
    virtualizerRef,
  })

  usePageScrollRestoreReady(!!scrollViewport)

  if (!scrollViewport) return <TopicDetailSkeleton />

  return (
    <div className="min-h-full">
      <Virtualizer
        cache={restoredVirtualCache}
        data={rows}
        item={TopicDetailVirtualItem}
        itemSize={TOPIC_DETAIL_ITEM_ESTIMATE}
        key={virtualizerMountKey}
        onScroll={saveVirtualScrollState}
        onScrollEnd={saveVirtualScrollState}
        ref={virtualizerRef}
        scrollRef={scrollRef}
        bufferSize={TOPIC_DETAIL_OVERSCAN * TOPIC_DETAIL_ITEM_ESTIMATE}
      >
        {(row) => <TopicDetailRow row={row} topic={topic} kind={kind} />}
      </Virtualizer>
      <MainBackToTopButton onBackToTop={scrollToTop} />
    </div>
  )
}

type TopicDetailRow =
  | {
      mainComment?: Comment
      key: string
      type: 'header'
    }
  | {
      count: number
      key: string
      type: 'comment-title'
    }
  | {
      comment: Comment
      floorNumber: number
      key: string
      type: 'comment'
    }
  | {
      key: string
      type: 'empty'
    }

function getTopicRows(topic: GroupTopic | SubjectTopic): TopicDetailRow[] {
  const [mainReply, ...replies] = topic.replies
  const rows: TopicDetailRow[] = [
    { key: 'header', mainComment: mainReply ? toComment(mainReply) : undefined, type: 'header' },
    { count: replies.length, key: 'comment-title', type: 'comment-title' },
  ]
  if (replies.length === 0) {
    rows.push({ key: 'empty', type: 'empty' })
    return rows
  }

  rows.push(
    ...replies.map((reply, index) => ({
      comment: toComment(reply),
      floorNumber: index + 2,
      key: `reply-${reply.id}`,
      type: 'comment' as const,
    })),
  )
  return rows
}

function TopicDetailRow({
  row,
  topic,
  kind,
}: {
  row: TopicDetailRow
  topic: GroupTopic | SubjectTopic
  kind: TopicKind
}) {
  if (row.type === 'header') {
    return (
      <div className="mx-auto max-w-5xl px-10 pt-8 pb-6">
        <TopicHeader topic={topic} kind={kind} mainComment={row.mainComment} />
      </div>
    )
  }

  if (row.type === 'comment-title') {
    return (
      <div className="mx-auto flex max-w-5xl flex-row items-center justify-between gap-4 px-10 pb-5">
        <h2 className="text-2xl font-medium">回复</h2>
        <span className="text-muted-foreground text-sm">{row.count}</span>
      </div>
    )
  }

  if (row.type === 'empty') {
    return (
      <div className="mx-auto max-w-5xl px-10 pb-10">
        <p className="text-muted-foreground text-sm">还没有回复。</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-10 pb-3">
      <CommentItem
        comment={row.comment}
        floorNumber={row.floorNumber}
        userAvatarViewTransition={false}
      />
    </div>
  )
}

function TopicHeader({
  topic,
  kind,
  mainComment,
}: {
  topic: GroupTopic | SubjectTopic
  kind: TopicKind
  mainComment?: Comment
}) {
  const setTitleInView = useSetAtom(communityTopicTitleInViewAtom)
  const { ref, inView } = useInView({ initialInView: true, threshold: 0.1 })
  const source =
    kind === 'group'
      ? {
          title: (topic as GroupTopic).group.title || (topic as GroupTopic).group.name,
          to: undefined,
        }
      : {
          title:
            (topic as SubjectTopic).subject.nameCN ||
            (topic as SubjectTopic).subject.name ||
            `条目 ${(topic as SubjectTopic).subject.id}`,
          to: `/subject/${(topic as SubjectTopic).subject.id}`,
        }

  useEffect(() => {
    setTitleInView(inView)
    return () => setTitleInView(true)
  }, [inView, setTitleInView, topic.id])

  return (
    <section className="flex flex-col gap-5" ref={ref}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Badge variant="outline">{kind === 'group' ? '小组' : '条目'}</Badge>
          <Badge variant="secondary" className="shadow-none">
            {topic.replyCount} 回复
          </Badge>
        </div>
        <h1 className="text-3xl leading-tight font-semibold">{topic.title}</h1>
        <div className="flex flex-row items-center gap-3">
          {topic.creator?.avatar.medium ? (
            <MyLink
              className="size-10 shrink-0"
              to={`/user/${encodeURIComponent(topic.creator.username)}`}
            >
              <Image
                className="size-10 overflow-hidden rounded-full"
                imageSrc={topic.creator.avatar.medium}
                loading="eager"
              />
            </MyLink>
          ) : (
            <div className="bg-muted size-10 shrink-0 rounded-full" />
          )}
          <div className="text-muted-foreground flex min-w-0 flex-row flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {topic.creator ? (
              <MyLink
                className="text-foreground hover:text-primary font-medium transition-colors"
                to={`/user/${encodeURIComponent(topic.creator.username)}`}
              >
                {topic.creator.nickname}
              </MyLink>
            ) : (
              <span className="text-foreground font-medium">#{topic.creatorID}</span>
            )}
            <time
              dateTime={dayjs.unix(topic.createdAt).toISOString()}
              title={dayjs.unix(topic.createdAt).format('YYYY-MM-DD HH:mm')}
            >
              {formatRecentUnixTime(topic.createdAt)}
            </time>
            {source.to ? (
              <MyLink className="text-primary underline-offset-2 hover:underline" to={source.to}>
                {source.title}
              </MyLink>
            ) : (
              <span>{source.title}</span>
            )}
          </div>
        </div>
      </div>
      {mainComment && <TopicMainPost comment={mainComment} />}
    </section>
  )
}

function TopicMainPost({ comment }: { comment: Comment }) {
  return (
    <div className="bbcode text-sm leading-7 whitespace-pre-line">
      {renderBBCode(comment.content)}
    </div>
  )
}

function toComment(reply: TopicReply): Comment {
  return {
    content: reply.content,
    createdAt: reply.createdAt,
    creatorID: reply.creatorID,
    id: reply.id,
    mainID: reply.id,
    reactions: reply.reactions,
    relatedID: 0,
    replies: reply.replies.map((child) => ({
      content: child.content,
      createdAt: child.createdAt,
      creatorID: child.creatorID,
      id: child.id,
      mainID: child.id,
      reactions: child.reactions,
      relatedID: 0,
      state: child.state,
      user: child.creator,
    })),
    state: reply.state,
    user: reply.creator,
  }
}

function TopicDetailVirtualItem({
  children,
  index,
  ref,
  style,
}: {
  children: ReactNode
  index: number
  ref?: React.Ref<HTMLDivElement>
  style: CSSProperties
}) {
  return (
    <div className="w-full" data-index={index} ref={ref} style={style}>
      {children}
    </div>
  )
}

function TopicDetailMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  )
}

function TopicDetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-10 py-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-row gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </section>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
