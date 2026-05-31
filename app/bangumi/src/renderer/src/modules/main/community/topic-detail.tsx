import {
  CommentItem,
  CommentSkeleton,
  CommentUserSignature,
  CommentUserUsername,
  hasVisibleCommentContent,
} from '@renderer/components/comment/comment-box'
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
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import { MainBackToTopButton } from '@renderer/modules/main/back-to-top-button'
import { communityTopicTitleInViewAtom } from '@renderer/state/in-view'
import { scrollViewportAtom } from '@renderer/state/scroll'
import dayjs from 'dayjs'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Virtualizer } from 'virtua'
import type { VirtualizerHandle } from 'virtua'

type TopicKind = 'group' | 'subject'

const TOPIC_DETAIL_ITEM_ESTIMATE = 148
const TOPIC_DETAIL_OVERSCAN = 8
const TOPIC_TITLE_HEADER_SHOW_OFFSET = 64
const TOPIC_TITLE_HEADER_HIDE_OFFSET = 96

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

  return (
    <TopicDetail
      topic={query.data}
      kind="group"
      onRefresh={() => query.refetch()}
      refreshing={query.isFetching}
    />
  )
}

function SubjectTopicDetail({ topicId }: { topicId: number }) {
  const query = useSubjectTopicQuery({ topicId })

  if (query.isLoading) return <TopicDetailSkeleton />
  if (query.isError || !query.data) return <TopicDetailMessage text="暂时无法读取条目讨论。" />

  return (
    <TopicDetail
      topic={query.data}
      kind="subject"
      onRefresh={() => query.refetch()}
      refreshing={query.isFetching}
    />
  )
}

function TopicDetail({
  topic,
  kind,
  onRefresh,
  refreshing,
}: {
  topic: GroupTopic | SubjectTopic
  kind: TopicKind
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
}) {
  const scrollViewport = useAtomValue(scrollViewportAtom)
  const setTitleInView = useSetAtom(communityTopicTitleInViewAtom)
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

  useEffect(() => {
    setTitleInView(true)
    return () => setTitleInView(true)
  }, [setTitleInView, topic.id])

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
        {(row) => (
          <TopicDetailRow
            row={row}
            topic={topic}
            kind={kind}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}
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
  const mainComment = mainReply ? toComment(mainReply) : undefined
  const visibleReplies = replies
    .map((reply, index) => ({
      comment: toComment(reply),
      floorNumber: index + 2,
      reply,
    }))
    .filter(({ comment }) => hasVisibleCommentContent(comment))
  const rows: TopicDetailRow[] = [
    {
      key: 'header',
      mainComment: mainComment && hasVisibleCommentContent(mainComment) ? mainComment : undefined,
      type: 'header',
    },
    { count: visibleReplies.length, key: 'comment-title', type: 'comment-title' },
  ]
  if (visibleReplies.length === 0) {
    rows.push({ key: 'empty', type: 'empty' })
    return rows
  }

  rows.push(
    ...visibleReplies.map(({ comment, floorNumber, reply }) => ({
      comment,
      floorNumber,
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
  onRefresh,
  refreshing,
}: {
  row: TopicDetailRow
  topic: GroupTopic | SubjectTopic
  kind: TopicKind
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
}) {
  if (row.type === 'header') {
    return (
      <div className="mx-auto max-w-5xl px-10 pt-8 pb-6">
        <TopicHeader
          topic={topic}
          kind={kind}
          mainComment={row.mainComment}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
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
  onRefresh,
  refreshing,
}: {
  topic: GroupTopic | SubjectTopic
  kind: TopicKind
  mainComment?: Comment
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
}) {
  const titleInView = useAtomValue(communityTopicTitleInViewAtom)
  const setTitleInView = useSetAtom(communityTopicTitleInViewAtom)
  const scrollViewport = useAtomValue(scrollViewportAtom)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const titleInViewRef = useRef(true)
  const source =
    kind === 'group'
      ? {
          title: (topic as GroupTopic).group.title || (topic as GroupTopic).group.name,
          to: `/group/${(topic as GroupTopic).group.name}`,
        }
      : {
          title:
            (topic as SubjectTopic).subject.nameCN ||
            (topic as SubjectTopic).subject.name ||
            `条目 ${(topic as SubjectTopic).subject.id}`,
          to: `/subject/${(topic as SubjectTopic).subject.id}`,
        }

  useEffect(() => {
    titleInViewRef.current = titleInView

    if (!scrollViewport) return

    let raf = 0
    const updateTitleInView = () => {
      raf = 0
      const titleElement = titleRef.current
      if (!titleElement) return

      const titleBottom = titleElement.getBoundingClientRect().bottom
      const viewportTop = scrollViewport.getBoundingClientRect().top
      const currentInView = titleInViewRef.current
      let nextInView = currentInView

      if (currentInView && titleBottom <= viewportTop + TOPIC_TITLE_HEADER_SHOW_OFFSET) {
        nextInView = false
      } else if (!currentInView && titleBottom >= viewportTop + TOPIC_TITLE_HEADER_HIDE_OFFSET) {
        nextInView = true
      }

      if (nextInView === currentInView) return

      titleInViewRef.current = nextInView
      setTitleInView(nextInView)
    }
    const scheduleUpdate = () => {
      if (raf) return
      raf = window.requestAnimationFrame(updateTitleInView)
    }

    updateTitleInView()
    scrollViewport.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      scrollViewport.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [scrollViewport, setTitleInView, titleInView, topic.id])

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-row flex-wrap items-center gap-2">
            <MyLink className="inline-flex max-w-full min-w-0" to={source.to}>
              <Badge
                variant="outline"
                className="hover:bg-primary/10 hover:text-primary max-w-full cursor-pointer gap-1.5 shadow-none transition-colors"
              >
                <span className="shrink-0">{kind === 'group' ? '小组' : '条目'}</span>
                <span className="text-muted-foreground">·</span>
                <span className="line-clamp-1 min-w-0">{source.title}</span>
              </Badge>
            </MyLink>
            <Badge variant="secondary" className="shadow-none">
              {topic.replyCount} 回复
            </Badge>
          </div>
          <QueryRefreshButton
            className="-mt-1"
            label="刷新帖子"
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        </div>
        <h1 className="text-3xl leading-tight font-semibold" ref={titleRef}>
          {topic.title}
        </h1>
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-row items-center gap-3">
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
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 flex-row items-center gap-1.5">
                {topic.creator ? (
                  <>
                    <MyLink
                      className="text-foreground hover:text-primary line-clamp-1 min-w-0 font-medium transition-colors"
                      to={`/user/${encodeURIComponent(topic.creator.username)}`}
                    >
                      {topic.creator.nickname}
                    </MyLink>
                    <CommentUserSignature sign={topic.creator.sign} />
                  </>
                ) : (
                  <span className="text-foreground line-clamp-1 font-medium">
                    #{topic.creatorID}
                  </span>
                )}
              </div>
              {topic.creator ? <CommentUserUsername username={topic.creator.username} /> : null}
            </div>
          </div>
          <time
            className="text-muted-foreground shrink-0 text-sm"
            dateTime={dayjs.unix(topic.createdAt).toISOString()}
            title={dayjs.unix(topic.createdAt).format('YYYY-MM-DD HH:mm')}
          >
            {formatRecentUnixTime(topic.createdAt)}
          </time>
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
