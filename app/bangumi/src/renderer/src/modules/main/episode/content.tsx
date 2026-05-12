import { MyLink } from '@renderer/components/my-link'
import { CommentItem, CommentSkeleton } from '@renderer/components/comment/comment-box'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectInfoAPIQuery } from '@renderer/data/hooks/api/subject'
import {
  useEpisodeCommentsByIdQuery,
  useEpisodeInfoByIdQuery,
} from '@renderer/data/hooks/api/episodes'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { useOpenSubjectEpisodesPanel } from '@renderer/modules/common/episodes/use-open-subject-episodes-panel'
import { MainBackToTopButton } from '@renderer/modules/main/back-to-top-button'
import { EpisodeCollectionActions } from '@renderer/modules/main/episode/collection-actions'
import { scrollViewportAtom } from '@renderer/state/scroll'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Virtualizer } from 'virtua'

const EPISODE_PAGE_VIRTUAL_ITEM_ESTIMATE = 148
const EPISODE_PAGE_VIRTUAL_OVERSCAN = 8

export function EpisodeContent({ episodeId }: { episodeId: string }) {
  const scrollViewport = useAtomValue(scrollViewportAtom)
  const scrollRef = useRef<HTMLElement | null>(null)
  scrollRef.current = scrollViewport

  const episodeQuery = useEpisodeInfoByIdQuery({ episodeId })
  const episode = episodeQuery.data
  const subjectId = episode?.subject_id.toString()
  const subjectQuery = useSubjectInfoAPIQuery({
    subjectId,
    enabled: !!subjectId,
    needKeepPreviousData: false,
  })
  const commentsQuery = useEpisodeCommentsByIdQuery({
    episodeId,
  })
  usePageScrollRestoreReady(
    !!scrollViewport && !episodeQuery.isPending && (!subjectId || !subjectQuery.isPending),
  )

  if (episodeQuery.isLoading || !episode || !scrollViewport) return <EpisodeSkeleton />

  const title = getEpisodeTitle(episode)
  const rows = getEpisodePageRows({
    comments: commentsQuery.data,
    commentsError: commentsQuery.isError,
    episode,
  })

  return (
    <div className="min-h-full">
      <Virtualizer
        data={rows}
        item={EpisodePageVirtualItem}
        itemSize={EPISODE_PAGE_VIRTUAL_ITEM_ESTIMATE}
        scrollRef={scrollRef}
        bufferSize={EPISODE_PAGE_VIRTUAL_OVERSCAN * EPISODE_PAGE_VIRTUAL_ITEM_ESTIMATE}
      >
        {(row) => (
          <EpisodePageRow row={row} title={title} episode={episode} subject={subjectQuery.data} />
        )}
      </Virtualizer>
      <MainBackToTopButton />
    </div>
  )
}

type EpisodePageRow =
  | {
      key: string
      type: 'detail'
    }
  | {
      count?: number
      key: string
      type: 'comment-title'
    }
  | {
      key: string
      type: 'loading'
    }
  | {
      key: string
      type: 'error'
    }
  | {
      key: string
      type: 'empty'
    }
  | {
      comment: NonNullable<ReturnType<typeof useEpisodeCommentsByIdQuery>['data']>[number]
      floorNumber: number
      key: string
      type: 'comment'
    }

function getEpisodePageRows({
  comments,
  commentsError,
  episode,
}: {
  comments?: NonNullable<ReturnType<typeof useEpisodeCommentsByIdQuery>['data']>
  commentsError: boolean
  episode: Episode
}): EpisodePageRow[] {
  const rows: EpisodePageRow[] = [{ key: 'detail', type: 'detail' }]
  const count = comments?.length ?? (episode.comment > 0 ? episode.comment : undefined)

  rows.push({ count, key: 'comment-title', type: 'comment-title' })

  if (commentsError) {
    rows.push({ key: 'comments-error', type: 'error' })
    return rows
  }

  if (comments === undefined) {
    rows.push({ key: 'comments-loading', type: 'loading' })
    return rows
  }

  if (comments.length === 0) {
    rows.push({ key: 'comments-empty', type: 'empty' })
    return rows
  }

  rows.push(
    ...comments.map((comment, index) => ({
      comment,
      floorNumber: index + 1,
      key: `comment-${comment.id}`,
      type: 'comment' as const,
    })),
  )

  return rows
}

function EpisodePageRow({
  row,
  title,
  episode,
  subject,
}: {
  row: EpisodePageRow
  title: string
  episode: Episode
  subject?: NonNullable<ReturnType<typeof useSubjectInfoAPIQuery>['data']>
}) {
  if (row.type === 'detail') {
    return (
      <div className="mx-auto max-w-6xl px-10 pt-10 pb-8">
        <EpisodeDetailSection episode={episode} subject={subject} title={title} />
      </div>
    )
  }

  if (row.type === 'comment-title') {
    return (
      <div className="mx-auto flex max-w-6xl flex-row items-center justify-between gap-4 px-10 pb-5">
        <h2 className="text-2xl font-medium">吐槽箱</h2>
        {row.count !== undefined && (
          <span className="text-muted-foreground text-sm">{row.count}</span>
        )}
      </div>
    )
  }

  if (row.type === 'loading') {
    return <EpisodeCommentsLoading />
  }

  if (row.type === 'error') {
    return (
      <div className="mx-auto max-w-6xl px-10 pb-10">
        <p className="text-muted-foreground text-sm">暂时无法读取吐槽箱。</p>
      </div>
    )
  }

  if (row.type === 'empty') {
    return (
      <div className="mx-auto max-w-6xl px-10 pb-10">
        <p className="text-muted-foreground text-sm">还没有吐槽。</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-10 pb-3">
      <CommentItem
        comment={row.comment}
        floorNumber={row.floorNumber}
        userAvatarViewTransition={true}
      />
    </div>
  )
}

function EpisodeDetailSection({
  episode,
  subject,
  title,
}: {
  episode: Episode
  subject?: NonNullable<ReturnType<typeof useSubjectInfoAPIQuery>['data']>
  title: string
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Badge variant="outline">{EpisodeType[episode.type] ?? '其他'}</Badge>
          <Badge variant="secondary" className="shadow-none">
            ep.{episode.sort}
          </Badge>
          {episode.comment > 0 && (
            <Badge variant="secondary" className="shadow-none">
              {episode.comment} 吐槽
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl leading-tight font-semibold">{title}</h1>
          {episode.name_cn && episode.name && (
            <p className="text-muted-foreground text-lg">{episode.name}</p>
          )}
        </div>
        {subject && (
          <MyLink
            to={`/subject/${subject.id}`}
            className="text-primary hover:bg-primary/10 w-fit rounded-sm px-1 text-sm underline-offset-2 hover:underline"
          >
            {subject.name_cn || subject.name}
          </MyLink>
        )}
      </div>

      <Card className="bg-background/70 p-4 shadow-none">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <EpisodeMeta episode={episode} />
          <div className="flex flex-col items-start gap-2 md:items-end">
            <EpisodeCollectionActions episode={episode} />
            <EpisodeActions
              episode={episode}
              subjectTitle={subject?.name_cn || subject?.name}
              episodeTotal={subject?.total_episodes}
            />
          </div>
        </div>
        {episode.desc && (
          <>
            <Separator className="my-4" />
            <p className="text-sm leading-7 whitespace-pre-wrap">{episode.desc}</p>
          </>
        )}
      </Card>
    </section>
  )
}

function EpisodeCommentsLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-10 pb-10">
      {Array(4)
        .fill(undefined)
        .map((_, index) => (
          <CommentSkeleton key={index} />
        ))}
    </div>
  )
}

function EpisodePageVirtualItem({
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

function EpisodeMeta({ episode }: { episode: Episode }) {
  const items = [
    ['首播', episode.airdate],
    ['时长', episode.duration],
    ['碟片', episode.disc ? episode.disc.toString() : ''],
  ].filter((item): item is [string, string] => !!item[1])

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">暂无更多章节信息。</p>
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div className="flex flex-col gap-1" key={label}>
          <dt className="text-muted-foreground text-xs">{label}</dt>
          <dd className="text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function EpisodeActions({
  episode,
  subjectTitle,
  episodeTotal,
}: {
  episode: Episode
  subjectTitle?: string
  episodeTotal?: number
}) {
  const episodesPanel = useOpenSubjectEpisodesPanel({
    subjectId: episode.subject_id.toString(),
    sourceTitle: subjectTitle || `条目 ${episode.subject_id}`,
    episodeTotal,
    initialOffset: getEpisodeInitialOffset(episode.sort),
  })

  if (!episodesPanel.canOpen) return null

  return (
    <Button
      variant="outline"
      className="w-fit gap-2 justify-self-start md:justify-self-end"
      onClick={episodesPanel.open}
    >
      <span className="i-mingcute-box-3-line text-base" />
      章节列表
    </Button>
  )
}

function EpisodeSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-10 py-10">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <Skeleton className="h-5 w-48" />
        </div>

        <Card className="bg-background/70 p-4 shadow-none">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-3">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <div className="flex flex-col gap-1" key={index}>
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </section>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-8 w-24" />
        <div className="flex flex-col gap-3">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <CommentSkeleton key={index} />
            ))}
        </div>
      </section>
    </div>
  )
}

function getEpisodeTitle(episode: Episode) {
  return (episode.name_cn || episode.name || `ep.${episode.sort}`).trim()
}

function getEpisodeInitialOffset(sort: number | undefined) {
  if (!sort || sort <= 1) return 0
  return Math.floor((sort - 1) / 100) * 100
}
