import { EpisodeGridContent } from '@renderer/modules/common/episodes/grid/content'
import { PageSelector } from '@renderer/modules/common/episodes/grid/page-selector'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useCollectionEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/collection'
import { useEpisodesInfoBySubjectIdQuery } from '@renderer/data/hooks/api/episodes'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { PropsWithChildren, Suspense, useDeferredValue, useState, useTransition } from 'react'
import { useSessionSuspense } from '@renderer/data/hooks/session'

export type EpisodeGridSize = {
  size?: 'small' | 'default'
}

type EpisodesGridProps = {
  subjectId: SubjectId
  eps: number
  selector?: boolean
  collectionType?: CollectionType
} & EpisodeGridSize

function EpisodesGridContent({
  subjectId,
  eps,
  size = 'default',
  selector = true,
  collectionType,
}: EpisodesGridProps) {
  const userInfo = useSessionSuspense()
  const [offset, setOffSet] = useState(0)
  const deferredOffset = useDeferredValue(offset)
  const [isPending, startTransition] = useTransition()
  const limit = 100
  let skeletonNumber = eps || 12
  if (skeletonNumber > 100) skeletonNumber = 100
  const isLogin = !!userInfo

  const setOffsetWithTransition = (newOffset: number | ((prev: number) => number)) => {
    startTransition(() => {
      setOffSet(newOffset)
    })
  }

  const props = {
    subjectId,
    size,
    selector,
    offset: deferredOffset,
    limit,
    setOffSet: setOffsetWithTransition,
    collectionType,
    isPending,
  }

  return isLogin ? (
    <AuthPageSelectorWrapper {...props}>
      <Suspense fallback={<EpisodeGridSkeleton skeletonNumber={skeletonNumber} size={size} />}>
        <AuthEpisodesGrid {...props} />
      </Suspense>
    </AuthPageSelectorWrapper>
  ) : (
    <NoAuthPageSelectorWrapper {...props}>
      <Suspense fallback={<EpisodeGridSkeleton skeletonNumber={skeletonNumber} size={size} />}>
        <NoAuthEpisodesGrid {...props} />
      </Suspense>
    </NoAuthPageSelectorWrapper>
  )
}

function NoAuthEpisodesGrid({
  subjectId,
  size = 'default',
  offset = 0,
  limit = 100,
  collectionType,
}: {
  subjectId: SubjectId
  size?: 'small' | 'default'
  collectionType?: CollectionType
  offset?: number
  limit?: number
}) {
  const episodes = useEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset,
    limit,
  })
  if (episodes.data.data === null) return null
  return (
    <EpisodeGridContent
      subjectId={subjectId}
      episodes={episodes.data.data}
      size={size}
      modifyEpisodeCollectionOpt={{ limit, offset }}
      collectionType={collectionType}
    />
  )
}

function AuthEpisodesGrid({
  subjectId,
  size = 'default',
  offset = 0,
  limit = 100,
  collectionType,
}: {
  subjectId: SubjectId
  size?: 'small' | 'default'
  collectionType?: CollectionType
  offset?: number
  limit?: number
}) {
  const episodes = useCollectionEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset,
    limit,
  })
  if (episodes.data.data === null) return null
  return (
    <EpisodeGridContent
      subjectId={subjectId}
      episodes={episodes.data.data}
      size={size}
      modifyEpisodeCollectionOpt={{ limit, offset }}
      collectionType={collectionType}
    />
  )
}

function NoAuthPageSelectorWrapper({
  subjectId,
  setOffSet,
  size = 'default',
  limit,
  selector,
  children,
  isPending,
}: PropsWithChildren<{
  subjectId: SubjectId
  setOffSet: (value: number | ((prev: number) => number)) => void
  limit: number
  size?: 'small' | 'default'
  selector?: boolean
  isPending: boolean
}>) {
  const episodes = useEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset: 0,
    limit,
  })
  if (episodes.data.data === null) return null
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      <div className={cn('flex flex-col gap-4')}>
        {selector && (
          <PageSelector
            episodes={episodes.data}
            limit={limit}
            setOffSet={setOffSet}
            isPending={isPending}
          />
        )}
        {children}
      </div>
    </div>
  )
}

function AuthPageSelectorWrapper({
  subjectId,
  setOffSet,
  size = 'default',
  limit,
  selector,
  children,
  isPending,
}: PropsWithChildren<{
  subjectId: SubjectId
  setOffSet: (value: number | ((prev: number) => number)) => void
  limit: number
  size?: 'small' | 'default'
  selector?: boolean
  isPending: boolean
}>) {
  const episodes = useCollectionEpisodesInfoBySubjectIdQuery({
    subjectId,
    offset: 0,
    limit,
  })
  if (episodes.data.data === null) return null
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      <div className={cn('flex flex-col gap-4')}>
        {selector && (
          <PageSelector
            episodes={episodes.data}
            limit={limit}
            setOffSet={setOffSet}
            isPending={isPending}
          />
        )}
        {children}
      </div>
    </div>
  )
}

function EpisodeGridSkeleton({
  skeletonNumber,
  size = 'default',
}: { skeletonNumber: number } & EpisodeGridSize) {
  return (
    <div className={cn('flex flex-row flex-wrap gap-1.5', size === 'small' && 'gap-1')}>
      {Array(skeletonNumber)
        .fill(0)
        .map((_, index) => (
          <Skeleton className={cn('size-9', size === 'small' && 'size-5')} key={index} />
        ))}
    </div>
  )
}

function EpisodesSkeleton({
  skeletonNumber,
  size = 'default',
}: { skeletonNumber: number } & EpisodeGridSize) {
  return (
    <div className="flex flex-col gap-5">
      {size === 'default' && <h2 className="text-2xl font-medium">章节</h2>}
      <div className={cn('flex flex-col gap-4')}>
        <EpisodeGridSkeleton skeletonNumber={skeletonNumber} size={size} />
      </div>
    </div>
  )
}

export function EpisodesGrid(props: EpisodesGridProps) {
  return (
    <Suspense
      fallback={<EpisodesSkeleton skeletonNumber={props.eps || 12} size={props.size} />}
      key={props.subjectId}
    >
      <EpisodesGridContent {...props} />
    </Suspense>
  )
}
