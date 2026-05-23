import { HoverCardTrigger } from '@renderer/components/hover-card/trigger'
import { EpisodeGridSize } from '@renderer/modules/common/episodes/grid/index'
import {
  CollectionShortcutModifierState,
  resolveEpisodeCollectionActionByShortcut,
} from '@renderer/constant/collection'
import {
  CollectionEpisode,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { getOnAirStatus } from '@renderer/lib/utils/date'
import {
  closeHoverCardImmediatelyAtomAction,
  hoverCardEpisodeContentAtom,
  hoverCardOpenAtom,
} from '@renderer/state/hover-card'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { MouseEvent, useEffect, useState } from 'react'
import { EpisodeButton } from '@renderer/components/button/episode'
import { useEpisodeCollectionActions } from '@renderer/modules/common/collections/use-episode-collection-actions'
import { useNavigate } from 'react-router-dom'

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
  mainEpisodeSortOffset = 0,
}: {
  index: number
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
  mainEpisodeSortOffset?: number
} & EpisodeGridSize &
  ModifyEpisodeCollectionOptType) {
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const displaySort =
    episode.type === EpisodeType['本篇'] ? episode.sort + mainEpisodeSortOffset : episode.sort
  const navigate = useNavigate()
  const [hoverCardContent, setHoverCardContent] = useAtom(hoverCardEpisodeContentAtom)
  const closeHoverCardImmediately = useSetAtom(closeHoverCardImmediatelyAtomAction)
  const collectionEpisodes = isCollectionEpisode(episodes) ? episodes : undefined
  const { currentAction, mutateByAction } = useEpisodeCollectionActions({
    index,
    subjectId: episode.subject_id.toString(),
    episodes: collectionEpisodes,
    modifyEpisodeCollectionOpt,
  })
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

  const toModifierState = (e: MouseEvent<HTMLButtonElement>): CollectionShortcutModifierState => ({
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
  })

  return (
    <HoverCardTrigger
      onOpen={() => {
        setHoverCardContent({
          id: 'episode-content',
          index,
          episodes,
          collectionType,
          modifyEpisodeCollectionOpt,
        })
        setSelfOpen(true)
      }}
    >
      <EpisodeButton
        key={episode.id}
        className={cn(
          `flex h-9 min-w-9 rounded-md px-2 py-0`,
          size === 'small' && 'h-5 min-w-5 rounded-sm px-1 text-[0.7rem]',
        )}
        variant={selfOpen && open ? `${status}Hover` : status}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (collectionEpisodes) {
            const action = resolveEpisodeCollectionActionByShortcut({
              defaultAction: '想看',
              modifierState: toModifierState(e),
            })
            if (action !== '想看' && action !== currentAction) {
              mutateByAction(action)
              return
            }
          }
          setSelfOpen(false)
          closeHoverCardImmediately()
          navigate(`/episode/${episode.id}`)
        }}
      >
        {displaySort}
      </EpisodeButton>
    </HoverCardTrigger>
  )
}
