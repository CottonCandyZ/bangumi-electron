import { EpisodeGridSize } from '@renderer/components/episodes/grid'
import EpisodeGridItem from '@renderer/components/episodes/grid/item'
import { CollectionEpisode, EpisodeCollectionType } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { cn } from '@renderer/lib/utils'
import { Fragment } from 'react/jsx-runtime'

function isCollectionEpisode(episodes: Episode | CollectionEpisode): episodes is CollectionEpisode {
  return (episodes as CollectionEpisode).type !== undefined
}

export function EpisodeGridContent({
  episodes,
  size = 'default',
}: {
  episodes: Episode[] | CollectionEpisode[]
} & EpisodeGridSize) {
  let firstTime = Array(7).fill(true) // 用来显示不同种类的数组, type 字段
  firstTime[0] = false // 本篇就不显示了
  return (
    <div className={cn('flex flex-row flex-wrap items-center gap-1', size === 'small' && 'gap-1')}>
      {episodes.map((episode: Episode | CollectionEpisode) => {
        let item: Episode
        let collectionType = EpisodeCollectionType.notCollected
        if (isCollectionEpisode(episode)) {
          item = episode.episode
          collectionType = episode.type
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
                  'relative flex size-10 items-center justify-center font-bold before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-lg before:bg-primary',
                  size === 'small' &&
                    'size-6 pl-1 text-xs font-normal before:bottom-1 before:left-[1px] before:top-1 before:w-[2.5px]',
                  item.type > 3 && 'pl-2',
                )}
                key={`${item.type}-tag`}
              >
                {item.type <= 3 ? EpisodeType[item.type] : '其他'}
              </div>
              <EpisodeGridItem
                episode={item}
                key={item.id}
                size={size}
                collectionType={collectionType}
              />
            </Fragment>
          )
        }
        return (
          <EpisodeGridItem
            episode={item}
            key={item.id}
            size={size}
            collectionType={collectionType}
          />
        )
      })}
    </div>
  )
}
