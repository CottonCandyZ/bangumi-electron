import { MediumHeader } from '@renderer/components/base/headers'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { EpisodeGridSize } from '@renderer/components/episodes/grid'
import { Button } from '@renderer/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { Separator } from '@renderer/components/ui/separator'
import { UI_CONFIG } from '@renderer/config'
import { EpisodeCollectionType } from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { cn } from '@renderer/lib/utils'
import { getDurationFromSeconds } from '@renderer/lib/utils/data-trans'
import { getOnAirStatus } from '@renderer/lib/utils/date'
import { isEmpty } from '@renderer/lib/utils/string'

export default function EpisodeGridItem({
  episode,
  size = 'default',
  collectionType = EpisodeCollectionType.notCollected,
}: {
  episode: Episode
  collectionType?: EpisodeCollectionType
} & EpisodeGridSize) {
  const duration = getDurationFromSeconds(episode.duration_seconds)
  const status =
    collectionType === EpisodeCollectionType.notCollected
      ? getOnAirStatus(episode.airdate)
      : (EpisodeCollectionType[collectionType] as Exclude<
          keyof typeof EpisodeCollectionType,
          'notCollected'
        >)

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <Button
          key={episode.id}
          className={cn(
            `h-10 min-w-10 rounded-md p-2`,
            size === 'small' && 'h-6 min-w-6 rounded-sm p-1 text-xs',
          )}
          variant={status}
        >
          {episode.sort}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-full min-w-64 max-w-96"
        collisionPadding={{
          right: 8,
          left: UI_CONFIG.NAV_WIDTH + 8,
          bottom: 8,
          top: UI_CONFIG.HEADER_HEIGHT + 8,
        }}
      >
        <div className="flex flex-col gap-2">
          {!isEmpty(episode.name) && <MediumHeader {...episode} />}
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
