import { MediumHeader } from '@renderer/components/headers'
import { HoverCardContent } from '@renderer/components/hover-card/content'
import { EpisodeCollectionButton } from '@renderer/modules/common/collections/episode-collection-button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { getDurationFromSeconds } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const TOP_SCROLL_FADE = [
  'transparent 0',
  'rgb(0 0 0 / 17%) 3px',
  'rgb(0 0 0 / 38%) 6px',
  'rgb(0 0 0 / 62%) 10px',
  'rgb(0 0 0 / 82%) 14px',
  'rgb(0 0 0 / 93%) 18px',
  'rgb(0 0 0 / 98%) 21px',
  'black 24px',
]

const BOTTOM_SCROLL_FADE = [
  'black calc(100% - 24px)',
  'rgb(0 0 0 / 98%) calc(100% - 21px)',
  'rgb(0 0 0 / 93%) calc(100% - 18px)',
  'rgb(0 0 0 / 82%) calc(100% - 14px)',
  'rgb(0 0 0 / 62%) calc(100% - 10px)',
  'rgb(0 0 0 / 38%) calc(100% - 6px)',
  'rgb(0 0 0 / 17%) calc(100% - 3px)',
  'transparent 100%',
]

function ScrollableEpisodeDescription({ children }: { children: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState({ top: false, bottom: false })

  const updateOverflow = useCallback(() => {
    const element = ref.current
    if (!element) return

    const top = element.scrollTop > 1
    const bottom = element.scrollTop + element.clientHeight < element.scrollHeight - 1
    setOverflow((current) =>
      current.top === top && current.bottom === bottom ? current : { top, bottom },
    )
  }, [])

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    updateOverflow()
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)

    return () => observer.disconnect()
  }, [updateOverflow])

  const maskImage =
    overflow.top || overflow.bottom
      ? `linear-gradient(to bottom, ${overflow.top ? TOP_SCROLL_FADE.join(', ') : 'black 0'}, ${
          overflow.bottom ? BOTTOM_SCROLL_FADE.join(', ') : 'black 100%'
        })`
      : undefined

  return (
    <div
      ref={ref}
      className="max-h-32 overflow-auto pr-2"
      style={{ maskImage, WebkitMaskImage: maskImage }}
      onScroll={updateOverflow}
    >
      <p className="whitespace-pre-wrap">{children}</p>
    </div>
  )
}

function isCollectionEpisode(
  episodes: Episode[] | CollectionEpisode[],
): episodes is CollectionEpisode[] {
  return (episodes as CollectionEpisode[])[0].episode !== undefined
}

export type HoverEpisodeDetailType = {
  id: 'episode-content'
  index: number
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
} & ModifyEpisodeCollectionOptType

export function HoverEpisodeDetail({ content }: { content: HoverEpisodeDetailType }) {
  const { index, episodes, modifyEpisodeCollectionOpt, collectionType } = content
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const duration = getDurationFromSeconds(episode.duration_seconds)
  const [bottom, setBottom] = useState(true)
  const username = useSessionUsername()
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId: episode.subject_id.toString(),
    username,
    enabled: !!username && !!collectionType,
    needKeepPreviousData: false,
  })
  const subjectCollection = subjectCollectionQuery.data
  const subjectCollectionType = collectionType ?? subjectCollection?.type

  return (
    <HoverCardContent align="start" isBottom={(value) => setBottom(value)}>
      <div
        className={cn(
          'flex max-w-96 min-w-64 flex-col gap-1.5 px-4',
          isCollectionEpisode(episodes) &&
            (subjectCollection === undefined || subjectCollectionType === CollectionType.watching)
            ? bottom
              ? 'pb-4'
              : 'pt-4'
            : 'py-4',
        )}
      >
        {bottom &&
          isCollectionEpisode(episodes) &&
          (subjectCollection === undefined ? (
            <div className="bg-background sticky top-0 pt-4 pb-2">
              <Skeleton className="h-9 w-52" />
            </div>
          ) : (
            subjectCollection !== null &&
            subjectCollectionType === CollectionType.watching && (
              <div className="bg-background sticky top-0 pt-4 pb-2">
                <EpisodeCollectionButton
                  subjectId={episode.subject_id.toString()}
                  index={index}
                  episodes={episodes}
                  modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                />
              </div>
            )
          ))}
        <div className="flex flex-row gap-x-2">
          <span className="font-semibold">ep.{episode.sort}</span>
          {!isEmpty(episode.name) && <MediumHeader {...episode} />}
        </div>
        {!isEmpty(episode.desc) && (
          <ScrollableEpisodeDescription>{episode.desc}</ScrollableEpisodeDescription>
        )}
        {!isEmpty(episode.airdate) && <span className="text-sm">首播：{episode.airdate}</span>}
        {!isEmpty(episode.duration) && (
          <span className="text-sm">
            时长：
            {`${duration.hours.toString().padStart(2, '0')} :
            ${duration.mins.toString().padStart(2, '0')} : ${duration.seconds.toString().padStart(2, '0')}`}
          </span>
        )}

        <span className="text-sm">讨论：{episode.comment}</span>
        {!bottom &&
          isCollectionEpisode(episodes) &&
          (subjectCollection === undefined ? (
            <div className="bg-background sticky bottom-0 z-0 pt-2 pb-4">
              <Skeleton className="h-9 w-52" />
            </div>
          ) : (
            subjectCollection !== null &&
            subjectCollectionType === CollectionType.watching && (
              <div className="bg-background sticky bottom-0 z-0 pt-2 pb-4">
                <EpisodeCollectionButton
                  subjectId={episode.subject_id.toString()}
                  index={index}
                  episodes={episodes}
                  modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                />
              </div>
            )
          ))}
      </div>
    </HoverCardContent>
  )
}
