import EpisodeGridItem from '@renderer/components/subject/episode/grid/item'
import PageSelector from '@renderer/components/subject/episode/grid/page-selector'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryEpisodesInfoBySubjectId } from '@renderer/data/hooks/api/episodes'
import { SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { cn } from '@renderer/lib/utils'
import { Fragment, useState } from 'react'

export default function EpisodesGrid({ subjectId, eps }: { subjectId: SubjectId; eps: number }) {
  const [offset, setOffSet] = useState(0)
  const limit = 100
  const episodesQuery = useQueryEpisodesInfoBySubjectId({
    id: subjectId,
    offset,
    limit,
  })
  const episodes = episodesQuery.data
  let firstTime = Array(7).fill(true) // 用来显示不同种类的数组, type 字段
  firstTime[0] = false // 本篇就不显示了
  let skeletonNumber = eps ?? 12
  if (skeletonNumber > 100) skeletonNumber = 100
  if (!episodes)
    return (
      <div className="flex flex-row flex-wrap gap-2 after:grow-[999]">
        {Array(skeletonNumber)
          .fill(0)
          .map((_, index) => (
            <Skeleton className="size-10" key={index} />
          ))}
      </div>
    )
  return (
    <div className={cn('flex flex-col gap-4')}>
      <PageSelector episodes={episodesQuery} limit={limit} setOffSet={setOffSet} />
      <div className={cn('flex flex-row flex-wrap gap-2 after:grow-[999]')}>
        {episodes.data.map((item) => {
          if (firstTime[item.type]) {
            firstTime[item.type] = false
            // 如果 type 比 3 大的话，均认为是“其他”类型
            if (item.type > 3) {
              firstTime = firstTime.fill(false, item.type)
            }
            return (
              <Fragment key={item.type}>
                {/* 换行用 */}
                <div className="w-full" key={`${item.type}-break-line`}></div>
                {/* 种类标签 */}
                <div
                  className={cn(
                    'relative flex size-10 items-center justify-center font-bold before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-lg before:bg-primary',
                    item.type > 3 && 'pl-2',
                  )}
                  key={`${item.type}-tag`}
                >
                  {item.type <= 3 ? EpisodeType[item.type] : '其他'}
                </div>
                <EpisodeGridItem episode={item} key={item.id} />
              </Fragment>
            )
          }
          return <EpisodeGridItem episode={item} key={item.id} />
        })}
      </div>
    </div>
  )
}
