import HoverCardTrigger from '@renderer/components/base/hover-card/trigger'
import { EpisodeGridSize } from '@renderer/components/episodes/grid'
import { Button } from '@renderer/components/ui/button'
import {
  CollectionEpisode,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { getOnAirStatus } from '@renderer/lib/utils/date'
import { hoverCardEpisodeContentAtom } from '@renderer/state/hover-card'
import { useSetAtom } from 'jotai'

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
  setEnabledForm,
}: {
  index: number
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
  setEnabledForm: (enabled: boolean) => void
} & EpisodeGridSize &
  ModifyEpisodeCollectionOptType) {
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const setHoverCardContent = useSetAtom(hoverCardEpisodeContentAtom)
  const episodeCollectionType = isCollectionEpisode(episodes)
    ? episodes[index].type
    : EpisodeCollectionType.notCollected
  const status =
    episodeCollectionType === EpisodeCollectionType.notCollected
      ? getOnAirStatus(episode.airdate)
      : (EpisodeCollectionType[episodeCollectionType] as Exclude<
          keyof typeof EpisodeCollectionType,
          'notCollected'
        >)

  return (
    <HoverCardTrigger
      onOpen={() => {
        setHoverCardContent({
          index,
          episodes,
          collectionType,
          setEnabledForm,
          modifyEpisodeCollectionOpt,
        })
      }}
    >
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
  )
}
