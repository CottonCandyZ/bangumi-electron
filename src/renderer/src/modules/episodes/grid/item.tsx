import { HoverCardTrigger } from '@renderer/components/hover-card/trigger'
import { EpisodeGridSize } from '@renderer/modules/episodes/grid/index'
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
import { hoverCardEpisodeContentAtom, hoverCardOpenAtom } from '@renderer/state/hover-card'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'

function isCollectionEpisode(
  episodes: Episode[] | CollectionEpisode[],
): episodes is CollectionEpisode[] {
  return (episodes as CollectionEpisode[])[0].episode !== undefined
}

export function EpisodeGridItem({
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
  const [hoverCardContent, setHoverCardContent] = useAtom(hoverCardEpisodeContentAtom)
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
  const [selfOpen, setSelfOpen] = useState(false)
  const open = useAtomValue(hoverCardOpenAtom)
  useEffect(() => {
    if (
      hoverCardContent !== null &&
      hoverCardContent.id === 'episode-content' &&
      hoverCardContent.episodes[hoverCardContent.index] !== episodes[index]
    )
      setSelfOpen(false)
  }, [hoverCardContent, episodes, index])

  return (
    <HoverCardTrigger
      onOpen={() => {
        setHoverCardContent({
          id: 'episode-content',
          index,
          episodes,
          collectionType,
          setEnabledForm,
          modifyEpisodeCollectionOpt,
        })
        setSelfOpen(true)
      }}
    >
      <Button
        key={episode.id}
        className={cn(
          `flex h-9 min-w-9 rounded-md px-2 py-0`,
          size === 'small' && 'h-6 min-w-6 rounded-sm px-1 text-xs',
        )}
        variant={selfOpen && open ? `${status}Hover` : status}
      >
        {episode.sort}
      </Button>
    </HoverCardTrigger>
  )
}
