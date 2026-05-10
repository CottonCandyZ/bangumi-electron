import { MyLink } from '@renderer/components/my-link'
import { CommentBox } from '@renderer/components/comment/comment-box'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectInfoAPIQuery } from '@renderer/data/hooks/api/subject'
import {
  useEpisodeCommentsByIdQuery,
  useEpisodeInfoByIdQuery,
  useEpisodesInfoBySubjectIdQuery,
} from '@renderer/data/hooks/api/episodes'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { MainBackToTopButton } from '@renderer/modules/main/back-to-top-button'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'

export function EpisodeContent({ episodeId }: { episodeId: string }) {
  const [enabledCommentsId, setEnabledCommentsId] = useState<string | null>(null)
  const enableComments = useCallback(() => setEnabledCommentsId(episodeId), [episodeId])
  const episodeQuery = useEpisodeInfoByIdQuery({ episodeId })
  const episode = episodeQuery.data
  const subjectId = episode?.subject_id.toString()
  const subjectQuery = useSubjectInfoAPIQuery({
    subjectId,
    enabled: !!subjectId,
    needKeepPreviousData: false,
  })
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId: subjectId ?? '',
    limit: 100,
    enabled: !!subjectId,
  })
  const commentsQuery = useEpisodeCommentsByIdQuery({
    episodeId,
    enabled: enabledCommentsId === episodeId,
  })

  if (episodeQuery.isLoading || !episode) return <EpisodeSkeleton />

  const title = getEpisodeTitle(episode)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-10 py-10">
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
          {subjectQuery.data && (
            <MyLink
              to={`/subject/${subjectQuery.data.id}`}
              className="text-primary hover:bg-primary/10 w-fit rounded-sm px-1 text-sm underline-offset-2 hover:underline"
            >
              {subjectQuery.data.name_cn || subjectQuery.data.name}
            </MyLink>
          )}
        </div>

        <Card className="bg-background/70 p-4 shadow-none">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <EpisodeMeta episode={episode} />
            <EpisodeActions
              episode={episode}
              subjectTitle={subjectQuery.data?.name_cn || subjectQuery.data?.name}
              episodes={episodesQuery.data?.data ?? undefined}
            />
          </div>
          {episode.desc && (
            <>
              <Separator className="my-4" />
              <p className="text-sm leading-7 whitespace-pre-wrap">{episode.desc}</p>
            </>
          )}
        </Card>
      </section>

      <CommentBox
        comments={commentsQuery.data}
        error={commentsQuery.isError}
        onInView={enableComments}
      />
      <MainBackToTopButton />
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
  episodes,
}: {
  episode: Episode
  subjectTitle?: string
  episodes?: Episode[] | null
}) {
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  if (!episodes || episodes.length === 0) return null

  return (
    <Button
      variant="outline"
      className="w-fit gap-2 justify-self-start md:justify-self-end"
      onClick={() =>
        openMonoListPanelTab({
          id: `subject-episodes-${episode.subject_id}`,
          type: 'subjectEpisodes',
          title: '章节',
          sourceTitle: subjectTitle || `条目 ${episode.subject_id}`,
          subjectId: episode.subject_id.toString(),
          episodes,
        })
      }
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
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-11 w-2/3" />
        <Card className="p-4 shadow-none">
          <Skeleton className="h-24 w-full" />
        </Card>
      </section>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </section>
    </div>
  )
}

function getEpisodeTitle(episode: Episode) {
  return (episode.name_cn || episode.name || `ep.${episode.sort}`).trim()
}
