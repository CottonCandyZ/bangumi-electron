import { EpisodeGridContent } from '@renderer/components/episodes/grid/content'
import PageSelector from '@renderer/components/episodes/grid/page-selector'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryCollectionEpisodesInfoBySubjectId } from '@renderer/data/hooks/api/collection'
import { useQueryEpisodesInfoBySubjectId } from '@renderer/data/hooks/api/episodes'
import { useIsLoginQuery } from '@renderer/data/hooks/session'
import { SubjectId } from '@renderer/data/types/bgm'
import { cn } from '@renderer/lib/utils'
import { useState } from 'react'

export type EpisodeGridSize = {
  size?: 'small' | 'default'
}
export default function EpisodesGrid({
  subjectId,
  eps,
  size = 'default',
  selector = true,
}: {
  subjectId: SubjectId
  eps: number
  selector?: boolean
} & EpisodeGridSize) {
  const isLogin = useIsLoginQuery()
  const [offset, setOffSet] = useState(0)
  const limit = 100
  let skeletonNumber = eps ?? 12
  if (skeletonNumber > 100) skeletonNumber = 100
  const episodesQuery = useQueryEpisodesInfoBySubjectId({
    subjectId,
    offset,
    limit,
    enabled: isLogin.data !== undefined && !isLogin.data,
  })

  const collectionEpisodesQuery = useQueryCollectionEpisodesInfoBySubjectId({
    subjectId,
    offset,
    limit,
    enabled: isLogin.data !== undefined && isLogin.data,
  })

  if (isLogin.data === undefined)
    return <EpisodeSkeleton skeletonNumber={skeletonNumber} size={size} />

  const episode = isLogin.data ? collectionEpisodesQuery : episodesQuery
  if (episode.data === undefined) {
    return <EpisodeSkeleton skeletonNumber={skeletonNumber} size={size} />
  }

  return (
    <div className={cn('flex flex-col gap-4')}>
      {selector && <PageSelector episodes={episode} limit={limit} setOffSet={setOffSet} />}
      <EpisodeGridContent episodes={episode.data.data} size={size} />
    </div>
  )
}

function EpisodeSkeleton({
  skeletonNumber,
  size = 'default',
}: { skeletonNumber: number } & EpisodeGridSize) {
  return (
    <div className={cn('flex flex-row flex-wrap gap-1')}>
      {Array(skeletonNumber)
        .fill(0)
        .map((_, index) => (
          <Skeleton className={cn('size-10', size === 'small' && 'size-6')} key={index} />
        ))}
    </div>
  )
}
