import { EpisodeGridContent } from '@renderer/modules/common/episodes/grid/content'
import {
  PageSelector,
  PageSelectorSkeleton,
} from '@renderer/modules/common/episodes/grid/page-selector'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useCollectionEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/collection'
import { useEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/episodes'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { useOpenSubjectEpisodesPanel } from '@renderer/modules/common/episodes/use-open-subject-episodes-panel'
import { cn } from '@renderer/lib/utils'
import { ListRestart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from '@renderer/data/hooks/session'

export type EpisodeGridSize = {
  size?: 'small' | 'default'
}

export function EpisodesGrid({
  subjectId,
  eps,
  size = 'default',
  selector = true,
  collectionType,
  sourceTitle,
  useOneBasedEpisodeSort = false,
}: {
  subjectId: SubjectId
  eps: number
  selector?: boolean
  collectionType?: CollectionType
  sourceTitle?: string
  useOneBasedEpisodeSort?: boolean
} & EpisodeGridSize) {
  const userInfo = useSession()
  const [offset, setOffSet] = useState(0)
  const [temporaryOneBasedEpisodeSort, setTemporaryOneBasedEpisodeSort] = useState(false)
  const limit = 100
  let skeletonNumber = eps ?? 12
  if (skeletonNumber > 100) skeletonNumber = 100
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset,
    limit,
    enabled: !userInfo,
  })

  const collectionEpisodesQuery = useCollectionEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset,
    limit,
    enabled: !!userInfo,
  })

  const episode = userInfo ? collectionEpisodesQuery : episodesQuery
  const episodesPanel = useOpenSubjectEpisodesPanel({
    subjectId,
    sourceTitle: sourceTitle || `条目 ${subjectId}`,
    episodeTotal: episode.data?.total,
    initialOffset: offset,
  })
  const episodeSortStart = getMainEpisodeSortStart(episode.data?.data, offset)
  const canUseOneBasedEpisodeSort = episodeSortStart !== null && episodeSortStart !== 1
  const showOneBasedEpisodeSort = useOneBasedEpisodeSort || temporaryOneBasedEpisodeSort
  const mainEpisodeSortOffset =
    canUseOneBasedEpisodeSort && showOneBasedEpisodeSort ? 1 - episodeSortStart : 0
  const oneBasedSortButtonLabel = showOneBasedEpisodeSort
    ? `还原为从 ${episodeSortStart} 开始计数`
    : '切换为从 1 开始计数'

  useEffect(() => {
    setTemporaryOneBasedEpisodeSort(false)
  }, [subjectId])

  if (userInfo === undefined) {
    return (
      <EpisodeSkeleton
        showSelector={selector && eps > limit}
        skeletonNumber={skeletonNumber}
        size={size}
      />
    )
  }

  if (episode.data === undefined) {
    return (
      <EpisodeSkeleton
        showSelector={selector && eps > limit}
        skeletonNumber={skeletonNumber}
        size={size}
      />
    )
  }
  if (episode.data.data === null) return null
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && (
        <div className="flex flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">章节</h2>
          {canUseOneBasedEpisodeSort && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant={showOneBasedEpisodeSort ? 'secondary' : 'outline'}
                  size="icon"
                  className="mt-1 size-8 shadow-none"
                  aria-label={oneBasedSortButtonLabel}
                  onClick={() => setTemporaryOneBasedEpisodeSort((value) => !value)}
                >
                  <ListRestart className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{oneBasedSortButtonLabel}</TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 size-8"
            disabled={!episodesPanel.canOpen}
            onClick={episodesPanel.open}
          >
            <span className="i-mingcute-box-3-line text-lg" />
          </Button>
        </div>
      )}
      <div className={cn('flex flex-col gap-4')}>
        {selector && (
          <PageSelector episodes={episode} limit={limit} offset={offset} setOffSet={setOffSet} />
        )}
        <EpisodeGridContent
          episodes={episode.data.data}
          size={size}
          modifyEpisodeCollectionOpt={{ limit, offset }}
          collectionType={collectionType}
          mainEpisodeSortOffset={mainEpisodeSortOffset}
        />
      </div>
    </div>
  )
}

function getEpisodeFromGridItem(item: Episode | CollectionEpisode) {
  return (item as CollectionEpisode).episode ?? item
}

function getMainEpisodeSortStart(
  episodes: Episode[] | CollectionEpisode[] | null | undefined,
  offset: number,
) {
  const firstMainEpisode = episodes
    ?.map(getEpisodeFromGridItem)
    .filter((item) => item.type === EpisodeType['本篇'])
    .at(0)

  return firstMainEpisode === undefined ? null : firstMainEpisode.sort - offset
}

function EpisodeSkeleton({
  showSelector = false,
  skeletonNumber,
  size = 'default',
}: {
  showSelector?: boolean
  skeletonNumber: number
} & EpisodeGridSize) {
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      <div className="flex flex-col gap-4">
        {showSelector && <PageSelectorSkeleton />}
        <div className={cn('flex flex-row flex-wrap gap-1.5', size === 'small' && 'gap-1')}>
          {Array(skeletonNumber)
            .fill(0)
            .map((_, index) => (
              <Skeleton className={cn('size-9', size === 'small' && 'size-5')} key={index} />
            ))}
        </div>
      </div>
    </div>
  )
}
