import { QueryFallback } from '@renderer/components/query-fallback'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  ALL_LOCAL_EPISODES_LIMIT,
  EPISODE_PAGE_SIZE,
  getEpisodePage,
} from '@renderer/data/collection/episode-progress'
import { useCollectionEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/collection'
import { useEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/episodes'
import { useSession } from '@renderer/data/hooks/session'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { EpisodeCarousel } from '@renderer/modules/common/episodes/carousel'
import { EpisodeGridContent } from '@renderer/modules/common/episodes/grid/content'
import {
  PageSelector,
  PageSelectorSkeleton,
} from '@renderer/modules/common/episodes/grid/page-selector'
import { EpisodeToolbar } from '@renderer/modules/common/episodes/grid/toolbar'
import { useOpenSubjectEpisodesPanel } from '@renderer/modules/common/episodes/use-open-subject-episodes-panel'
import { episodeViewModeAtom } from '@renderer/state/episodes'
import { useAtomValue } from 'jotai'
import { useState } from 'react'

export type EpisodeGridSize = { size?: 'small' | 'default' }
type Props = {
  subjectId: SubjectId
  eps: number
  selector?: boolean
  collectionType?: CollectionType
  sourceTitle?: string
  useOneBasedEpisodeSort?: boolean
} & EpisodeGridSize

export function EpisodesGrid(props: Props) {
  const userInfo = useSession()
  return (
    <EpisodesView
      key={`${props.subjectId}:${userInfo?.id ?? 'guest'}`}
      {...props}
      userInfo={userInfo}
    />
  )
}

function EpisodesView({
  subjectId,
  eps,
  size = 'default',
  selector = true,
  collectionType,
  sourceTitle,
  useOneBasedEpisodeSort = false,
  userInfo,
}: Props & { userInfo: ReturnType<typeof useSession> }) {
  const [requestedOffset, setRequestedOffset] = useState<number | null>(null)
  const [temporaryOneBasedEpisodeSort, setTemporaryOneBasedEpisodeSort] = useState(false)
  const viewMode = useAtomValue(episodeViewModeAtom)
  const limit = EPISODE_PAGE_SIZE
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset: requestedOffset ?? 0,
    limit,
    enabled: userInfo === null,
    needKeepPreviousData: false,
  })
  const collectionEpisodesQuery = useCollectionEpisodesInfoBySubjectIdQuery({
    subjectId,
    limit: ALL_LOCAL_EPISODES_LIMIT,
    enabled: !!userInfo,
  })
  const episodeQuery = userInfo ? collectionEpisodesQuery : episodesQuery
  const { progress, offset, episodes, episodeSortStart } = getEpisodePage({
    episodes: episodeQuery.data?.data ?? [],
    collection: !!userInfo,
    requestedOffset,
    compact: size === 'small',
  })
  const episodesPanel = useOpenSubjectEpisodesPanel({
    episodeTotal: episodeQuery.data?.total,
    initialOffset: offset,
    sourceTitle: sourceTitle || `条目 ${subjectId}`,
    subjectId,
  })
  const showOneBasedEpisodeSort = useOneBasedEpisodeSort || temporaryOneBasedEpisodeSort
  const mainEpisodeSortOffset = showOneBasedEpisodeSort ? 1 - episodeSortStart : 0

  if (episodeQuery.isError && !episodeQuery.data)
    return (
      <QueryFallback
        layout={size === 'small' ? 'panel' : 'card'}
        label="章节"
        error={episodeQuery.error}
        onRetry={episodeQuery.refetch}
      />
    )
  if (userInfo === undefined || episodeQuery.data === undefined)
    return (
      <EpisodeSkeleton
        showSelector={selector && eps > limit}
        skeletonNumber={Math.min(eps > 0 ? eps : 12, limit)}
        size={size}
      />
    )
  if (!episodeQuery.data.data?.length) return null

  const pagination = selector && (
    <PageSelector
      episodes={episodeQuery}
      limit={limit}
      offset={offset}
      setOffSet={setRequestedOffset}
    />
  )
  const header = (
    <EpisodeToolbar
      episodeSortStart={episodeSortStart}
      oneBased={showOneBasedEpisodeSort}
      onToggleSort={() => setTemporaryOneBasedEpisodeSort((value) => !value)}
      episodesPanel={episodesPanel}
      progressEpisodes={progress.main}
      subjectId={subjectId}
      pagination={pagination}
    />
  )
  const gridContent = (
    <EpisodeGridContent
      episodes={episodes}
      size={size}
      modifyEpisodeCollectionOpt={{ limit, offset }}
      collectionType={collectionType}
      mainEpisodeSortOffset={mainEpisodeSortOffset}
    />
  )
  // Keep the toolbar mounted while only the episode content changes view modes.
  if (size === 'default')
    return (
      <EpisodeCarousel
        key={offset}
        episodes={episodes}
        initialEpisodeId={progress.anchor?.episode.id}
        mainEpisodeSortOffset={mainEpisodeSortOffset}
        header={header}
        gridContent={viewMode === 'grid' ? gridContent : undefined}
        collectionType={collectionType}
        modifyEpisodeCollectionOpt={{ limit, offset }}
      />
    )
  return (
    <div className="min-w-0">
      {pagination}
      {gridContent}
    </div>
  )
}

function EpisodeSkeleton({
  showSelector,
  skeletonNumber,
  size,
}: { showSelector: boolean; skeletonNumber: number } & EpisodeGridSize) {
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      {showSelector && <PageSelectorSkeleton />}
      <div className={cn('flex flex-wrap gap-1.5', size === 'small' && 'gap-1')}>
        {Array.from({ length: skeletonNumber }, (_, index) => (
          <Skeleton className={cn('size-9', size === 'small' && 'size-5')} key={index} />
        ))}
      </div>
    </div>
  )
}
