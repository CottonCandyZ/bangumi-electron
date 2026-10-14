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
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { MouseEvent, useMemo } from 'react'
import { EpisodeButton } from '@renderer/components/button/episode'
import { useEpisodeCollectionActions } from '@renderer/modules/common/collections/use-episode-collection-actions'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

function isCollectionEpisode(
  episodes: Episode[] | CollectionEpisode[],
): episodes is CollectionEpisode[] {
  return (episodes as CollectionEpisode[])[0].episode !== undefined
}

export function EpisodeGridItem({
  size = 'default',
  index,
  episodes,
  dataUpdatedAt,
  modifyEpisodeCollectionOpt,
  collectionType,
  mainEpisodeSortOffset = 0,
  presentation = 'number',
}: {
  index: number
  episodes: Episode[] | CollectionEpisode[]
  dataUpdatedAt: number
  collectionType: CollectionType | undefined
  mainEpisodeSortOffset?: number
  presentation?: 'number' | 'card'
} & EpisodeGridSize &
  ModifyEpisodeCollectionOptType) {
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const displaySort =
    episode.type === EpisodeType['本篇'] ? episode.sort + mainEpisodeSortOffset : episode.sort
  const navigate = useNavigate()
  const setHoverCardContent = useSetAtom(hoverCardEpisodeContentAtom)
  const closeHoverCardImmediately = useSetAtom(closeHoverCardImmediatelyAtomAction)
  const collectionEpisodes = isCollectionEpisode(episodes) ? episodes : undefined
  const { currentAction, isPending, mutateByAction } = useEpisodeCollectionActions({
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
      ? getOnAirStatus(episode.airdate, dataUpdatedAt)
      : (EpisodeCollectionType[episodeCollectionType] as Exclude<
          keyof typeof EpisodeCollectionType,
          'notCollected'
        >)
  // 只订阅「自己是否是当前打开的那张卡片」，避免卡片开关时所有剧集按钮一起重渲染
  const isHoverCardOwnerAtom = useMemo(
    () =>
      atom((get) => {
        const content = get(hoverCardEpisodeContentAtom)
        return (
          get(hoverCardOpenAtom) &&
          content !== null &&
          content.id === 'episode-content' &&
          content.episodes[content.index] === episodes[index]
        )
      }),
    [episodes, index],
  )
  const isHoverCardOwner = useAtomValue(isHoverCardOwnerAtom)

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
      }}
    >
      <EpisodeButton
        key={episode.id}
        className={cn(
          `flex h-9 min-w-9 rounded-md px-2 py-0`,
          size === 'small' && 'h-5 min-w-5 rounded-sm px-1 text-[0.7rem]',
          presentation === 'card' &&
            'h-16 w-full flex-col items-start justify-center gap-1 px-3 py-2 text-left font-normal whitespace-normal shadow-none hover:shadow-none',
        )}
        aria-label={`${episode.type === EpisodeType.本篇 ? '第' : (EpisodeType[episode.type] ?? '其他')} ${displaySort} 集 ${episode.name_cn || episode.name}`}
        disabled={isPending}
        variant={isHoverCardOwner ? `${status}Hover` : status}
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
          closeHoverCardImmediately()
          navigate(`/episode/${episode.id}`)
        }}
      >
        {presentation === 'card' ? (
          <>
            <span className="flex w-full items-center justify-between gap-2 text-[10px] font-medium opacity-70">
              <span>
                {episode.type === EpisodeType.本篇 ? 'EP' : (EpisodeType[episode.type] ?? '其他')}.
                {displaySort}
              </span>
              {episodeCollectionType === EpisodeCollectionType.watched && (
                <Check className="size-3" />
              )}
            </span>
            <span className="w-full truncate text-xs font-medium">
              {episode.name_cn || episode.name || '—'}
            </span>
          </>
        ) : (
          <span className="episode-label">{displaySort}</span>
        )}
      </EpisodeButton>
    </HoverCardTrigger>
  )
}
