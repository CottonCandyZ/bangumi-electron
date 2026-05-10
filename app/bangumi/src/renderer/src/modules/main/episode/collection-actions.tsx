import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCollectionEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/collection'
import { useSession } from '@renderer/data/hooks/session'
import { Episode } from '@renderer/data/types/episode'
import { EpisodeCollectionButton } from '@renderer/modules/common/collections/episode-collection-button'

const EPISODE_COLLECTION_PAGE_LIMIT = 100

export function EpisodeCollectionActions({ episode }: { episode: Episode }) {
  const userInfo = useSession()
  const offset = getEpisodeCollectionOffset(episode.sort)
  const collectionEpisodesQuery = useCollectionEpisodesInfoBySubjectIdQuery({
    subjectId: episode.subject_id.toString(),
    limit: EPISODE_COLLECTION_PAGE_LIMIT,
    offset,
    enabled: !!userInfo,
  })

  if (userInfo === null) return null
  if (userInfo === undefined || collectionEpisodesQuery.data === undefined) {
    return <Skeleton className="h-9 w-64 max-w-full" />
  }

  const episodes = collectionEpisodesQuery.data.data
  if (!episodes) return null

  const index = episodes.findIndex((item) => item.episode.id === episode.id)
  if (index < 0) return null

  return (
    <EpisodeCollectionButton
      subjectId={episode.subject_id.toString()}
      index={index}
      episodes={episodes}
      modifyEpisodeCollectionOpt={{
        limit: EPISODE_COLLECTION_PAGE_LIMIT,
        offset,
      }}
    />
  )
}

function getEpisodeCollectionOffset(sort: number | undefined) {
  if (!sort || sort <= 1) return 0
  return Math.floor((sort - 1) / EPISODE_COLLECTION_PAGE_LIMIT) * EPISODE_COLLECTION_PAGE_LIMIT
}
