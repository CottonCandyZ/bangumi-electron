import { EpisodeGridSize } from '@renderer/modules/common/episodes/grid/index'
import { EpisodeGridItem } from '@renderer/modules/common/episodes/grid/item'
import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { Fragment } from 'react/jsx-runtime'

function isCollectionEpisode(episode: Episode | CollectionEpisode): episode is CollectionEpisode {
  return (episode as CollectionEpisode).episode !== undefined
}
export function EpisodeGridContent({
  episodes,
  size = 'default',
  modifyEpisodeCollectionOpt,
  collectionType,
  mainEpisodeSortOffset = 0,
}: {
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
  mainEpisodeSortOffset?: number
} & EpisodeGridSize &
  ModifyEpisodeCollectionOptType) {
  let firstTime = Array(7).fill(true) // 用来显示不同种类的数组, type 字段
  firstTime[0] = false // 本篇就不显示了

  return (
    <div
      className={cn('flex flex-row flex-wrap items-center gap-1.5', size === 'small' && 'gap-1')}
    >
      {episodes.map((episode: Episode | CollectionEpisode, index: number) => {
        let item: Episode
        if (isCollectionEpisode(episode)) {
          item = episode.episode
        } else {
          item = episode
        }
        if (firstTime[item.type]) {
          firstTime[item.type] = false
          // 如果 type 比 3 大的话，均认为是“其他”类型
          if (item.type > 3) {
            firstTime = firstTime.fill(false, item.type)
          }
          return (
            <Fragment key={item.type}>
              {/* 换行用 */}
              {size === 'default' && <div className="w-full" key={`${item.type}-break-line`} />}
              {/* 种类标签 */}
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center',
                  size === 'small'
                    ? 'h-5 gap-1 px-1 text-[0.7rem] font-normal'
                    : 'before:bg-primary relative h-10 min-w-10 border border-transparent font-bold before:absolute before:top-2 before:bottom-2 before:left-0 before:w-1 before:rounded-lg',
                  size === 'default' && item.type > 3 && 'pl-2',
                )}
                key={`${item.type}-tag`}
              >
                {size === 'small' && (
                  <svg
                    aria-hidden="true"
                    className="text-primary h-3 w-[2px] shrink-0 overflow-visible"
                    viewBox="0 0 2 12"
                    preserveAspectRatio="none"
                  >
                    {/* Keep the stroke crisp at fractional positions and UI zoom levels. */}
                    <line
                      x1="1"
                      x2="1"
                      y1="0"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="crispEdges"
                    />
                  </svg>
                )}
                {item.type <= 3 ? EpisodeType[item.type] : '其他'}
              </div>
              <EpisodeGridItem
                key={item.id}
                size={size}
                index={index}
                episodes={episodes}
                modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                collectionType={collectionType}
                mainEpisodeSortOffset={mainEpisodeSortOffset}
              />
            </Fragment>
          )
        }
        return (
          <EpisodeGridItem
            key={item.id}
            size={size}
            index={index}
            episodes={episodes}
            modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
            collectionType={collectionType}
            mainEpisodeSortOffset={mainEpisodeSortOffset}
          />
        )
      })}
    </div>
  )
}
