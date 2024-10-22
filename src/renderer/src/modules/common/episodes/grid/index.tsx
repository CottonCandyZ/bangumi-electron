import { EpisodeGridContent } from '@renderer/modules/common/episodes/grid/content'
import { PageSelector } from '@renderer/modules/common/episodes/grid/page-selector'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useQueryCollectionEpisodesInfoBySubjectId } from '@renderer/data/hooks/api/collection'
import { useQueryEpisodesInfoBySubjectId } from '@renderer/data/hooks/api/episodes'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { useState } from 'react'

export type EpisodeGridSize = {
  size?: 'small' | 'default'
}
export function EpisodesGrid({
  subjectId,
  eps,
  size = 'default',
  selector = true,
  collectionType,
}: {
  subjectId: SubjectId
  eps: number
  selector?: boolean
  collectionType?: CollectionType
} & EpisodeGridSize) {
  const { userInfo } = useSession()
  const [offset, setOffSet] = useState(0)
  const limit = 100
  let skeletonNumber = eps ?? 12
  if (skeletonNumber > 100) skeletonNumber = 100
  const episodesQuery = useQueryEpisodesInfoBySubjectId({
    subjectId,
    offset,
    limit,
    enabled: !userInfo,
  })

  const collectionEpisodesQuery = useQueryCollectionEpisodesInfoBySubjectId({
    subjectId,
    offset,
    limit,
    enabled: !!userInfo,
  })

  if (userInfo === undefined) return <EpisodeSkeleton skeletonNumber={skeletonNumber} size={size} />

  const episode = userInfo ? collectionEpisodesQuery : episodesQuery
  if (episode.data === undefined) {
    return <EpisodeSkeleton skeletonNumber={skeletonNumber} size={size} />
  }
  if (episode.data.data === null) return null

  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      <div className={cn('flex flex-col gap-4')}>
        {selector && <PageSelector episodes={episode} limit={limit} setOffSet={setOffSet} />}
        <EpisodeGridContent
          subjectId={subjectId}
          episodes={episode.data.data}
          size={size}
          modifyEpisodeCollectionOpt={{ limit, offset }}
          collectionType={collectionType}
        />
      </div>
    </div>
  )
}

function EpisodeSkeleton({
  skeletonNumber,
  size = 'default',
}: { skeletonNumber: number } & EpisodeGridSize) {
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      <div className={cn('flex flex-row flex-wrap gap-1.5', size === 'small' && 'gap-1')}>
        {Array(skeletonNumber)
          .fill(0)
          .map((_, index) => (
            <Skeleton className={cn('size-9', size === 'small' && 'size-5')} key={index} />
          ))}
      </div>
    </div>
  )
}
