import { MediumHeader } from '@renderer/components/base/headers'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import EpisodeCollectionButton from '@renderer/components/collections/episode-collection-button'
import { EpisodeGridSize } from '@renderer/components/episodes/grid'
import { Button } from '@renderer/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { Separator } from '@renderer/components/ui/separator'
import {
  CollectionEpisode,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { getDurationFromSeconds } from '@renderer/lib/utils/data-trans'
import { getOnAirStatus } from '@renderer/lib/utils/date'
import { isEmpty } from '@renderer/lib/utils/string'
import { useState } from 'react'

function isCollectionEpisode(
  episodes: Episode[] | CollectionEpisode[],
): episodes is CollectionEpisode[] {
  return (episodes as CollectionEpisode[])[0].episode !== undefined
}

export default function EpisodeGridItem({
  size = 'default',
  index,
  episodes,
  modifyEpisodeCollectionOpt,
  collectionType,
}: {
  index: number
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
} & EpisodeGridSize &
  ModifyEpisodeCollectionOptType) {
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const episodeCollectionType = isCollectionEpisode(episodes)
    ? episodes[index].type
    : EpisodeCollectionType.notCollected
  const duration = getDurationFromSeconds(episode.duration_seconds)
  const status =
    episodeCollectionType === EpisodeCollectionType.notCollected
      ? getOnAirStatus(episode.airdate)
      : (EpisodeCollectionType[episodeCollectionType] as Exclude<
          keyof typeof EpisodeCollectionType,
          'notCollected'
        >)
  const [open, setOpen] = useState(false)

  return (
    <HoverCard openDelay={150} open={open} onOpenChange={setOpen} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          key={episode.id}
          className={cn(
            `h-10 min-w-10 rounded-md p-2`,
            size === 'small' && 'h-6 min-w-6 rounded-sm p-1 text-xs',
          )}
          variant={open ? `${status}Hover` : status}
        >
          {episode.sort}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-full min-w-64 max-w-96">
        <div className="flex flex-col gap-2">
          {isCollectionEpisode(episodes) && (
            <EpisodeCollectionButton
              episodes={episodes}
              index={index}
              modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
              collectionType={collectionType}
            />
          )}
          <div className="flex flex-row flex-wrap gap-x-2">
            <span className="font-bold">ep.{episode.sort}</span>
            {!isEmpty(episode.name) && <MediumHeader {...episode} />}
          </div>
          {!isEmpty(episode.desc) && (
            <>
              <ScrollWrapper className="max-h-32 pr-2">
                <p className="whitespace-pre-wrap">{episode.desc}</p>
              </ScrollWrapper>
              <Separator />
            </>
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
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
