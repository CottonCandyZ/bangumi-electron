import { CollectionEpisode, EpisodeCollectionType } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'

// Collection episodes are read from the complete local snapshot, not the public API.
export const ALL_LOCAL_EPISODES_LIMIT = 1_000_000
export const EPISODE_PAGE_SIZE = 100

export function isCollectionEpisode(item: Episode | CollectionEpisode): item is CollectionEpisode {
  return 'episode' in item
}

export function getEpisode(item: Episode | CollectionEpisode): Episode {
  return isCollectionEpisode(item) ? item.episode : item
}

export function getMainEpisodes(episodes: CollectionEpisode[]) {
  return episodes
    .filter((item) => item.episode.type === EpisodeType.本篇)
    .sort((a, b) => a.episode.sort - b.episode.sort || a.episode.id - b.episode.id)
}

export function getEpisodeProgress(episodes: CollectionEpisode[]) {
  const main = getMainEpisodes(episodes)
  const lastWatched = main.findLast((item) => item.type === EpisodeCollectionType.watched)
  const anchor = lastWatched ?? main[0]
  return {
    main,
    anchor,
    lastWatched,
  }
}

export function getEpisodePage({
  episodes,
  collection,
  requestedOffset,
  compact,
}: {
  episodes: Episode[] | CollectionEpisode[]
  collection: boolean
  requestedOffset: number | null
  compact: boolean
}) {
  const progress = getEpisodeProgress(collection ? (episodes as CollectionEpisode[]) : [])
  const anchorIndex = Math.max(
    0,
    episodes.findIndex((item) => getEpisode(item).id === progress.anchor?.episode.id),
  )
  const initialOffset = compact
    ? 0
    : Math.floor(anchorIndex / EPISODE_PAGE_SIZE) * EPISODE_PAGE_SIZE
  const offset = requestedOffset ?? initialOffset
  const firstMain = episodes.map(getEpisode).find((item) => item.type === EpisodeType.本篇)
  const episodeSortStart = firstMain ? firstMain.sort - (collection ? 0 : offset) : 1
  return {
    progress,
    offset,
    episodeSortStart,
    episodes: collection ? episodes.slice(offset, offset + EPISODE_PAGE_SIZE) : episodes,
  }
}

export function getWatchedThroughEpisodes(episodes: CollectionEpisode[], episodeId: number) {
  const target = episodes.find((item) => item.episode.id === episodeId)
  if (!target) return []
  // A “seen through” action stays within its episode kind, including on later pages.
  // Explicitly dropped episodes retain their status, as on the web progress manager.
  return episodes.filter(
    (item) =>
      item.episode.subject_id === target.episode.subject_id &&
      item.episode.type === target.episode.type &&
      item.episode.sort <= target.episode.sort &&
      item.type !== EpisodeCollectionType.watched &&
      item.type !== EpisodeCollectionType.abandoned,
  )
}

export function findEpisodeByInput(
  episodes: CollectionEpisode[],
  input: string,
  sortOffset: number,
) {
  if (!input.trim() || !Number.isFinite(Number(input))) return undefined
  return episodes.find((item) => item.episode.sort + sortOffset === Number(input))
}
