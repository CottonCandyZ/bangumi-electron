import { Carousel, CarouselContent, CarouselItem } from '@renderer/components/ui/carousel'
import { getEpisode } from '@renderer/data/collection/episode-progress'
import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { EpisodeGridItem } from '@renderer/modules/common/episodes/grid/item'
import { useState, type ReactNode } from 'react'

export function EpisodeCarousel({
  episodes,
  initialEpisodeId,
  mainEpisodeSortOffset,
  header,
  gridContent,
  collectionType,
  modifyEpisodeCollectionOpt,
}: {
  episodes: Episode[] | CollectionEpisode[]
  initialEpisodeId?: number
  mainEpisodeSortOffset: number
  header: ReactNode
  gridContent?: ReactNode
  collectionType?: CollectionType
} & ModifyEpisodeCollectionOptType) {
  // A collection refresh should not move a carousel the user is browsing.
  const [startIndex] = useState(() =>
    Math.max(
      0,
      episodes.findIndex((item) => getEpisode(item).id === initialEpisodeId),
    ),
  )
  return (
    <Carousel
      className="w-full min-w-0"
      opts={{ align: 'start', containScroll: 'trimSnaps', startIndex }}
      aria-label={gridContent ? '章节' : '章节卡片'}
      aria-roledescription={gridContent ? undefined : 'carousel'}
    >
      {header}
      {gridContent ?? (
        <CarouselContent className="-ml-2 py-1">
          {episodes.map((item, index) => (
            <CarouselItem key={getEpisode(item).id} className="basis-48 pl-2">
              <EpisodeGridItem
                presentation="card"
                episodes={episodes}
                index={index}
                collectionType={collectionType}
                modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                mainEpisodeSortOffset={mainEpisodeSortOffset}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      )}
    </Carousel>
  )
}
