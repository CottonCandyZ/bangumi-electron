import EpisodeGridItem from '@renderer/components/episode/grid/item'
import PageSelector from '@renderer/components/episode/grid/page-selector'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryEpisodesInfoBySubjectId } from '@renderer/constants/hooks/api/episodes'
import { SubjectId } from '@renderer/constants/types/bgm'
import { cn } from '@renderer/lib/utils'
import { EPISODE_TYPE_MAP } from '@renderer/lib/utils/map'
import { useState } from 'react'

export default function EpisodesGrid({ subjectId }: { subjectId: SubjectId }) {
  const [offset, setOffSet] = useState(0)
  const limit = 100
  const episodes = useQueryEpisodesInfoBySubjectId({
    id: subjectId,
    enabled: !!subjectId,
    offset,
    limit,
  })
  const episodesData = episodes.data
  let firstTime = Array(7).fill(true) // 用来显示不同种类的数组, type 字段
  firstTime[0] = false // 本篇就不显示了
  if (!episodesData) return <Skeleton className="h-10" />
  return (
    <div className={cn('flex flex-col gap-4')}>
      <PageSelector episodes={episodes} limit={limit} setOffSet={setOffSet} />
      <div className={cn('flex flex-row flex-wrap gap-2 after:grow-[999]')}>
        {episodesData.data.map((item) => {
          if (firstTime[item.type]) {
            firstTime[item.type] = false
            // 如果 type 比 3 大的话，均认为是“其他”类型
            if (item.type > 3) {
              firstTime = firstTime.fill(false, item.type)
            }
            return (
              <>
                {/* 换行用 */}
                <div className="w-full" key={`${item.type}-break-line`}></div>
                {/* 种类标签 */}
                <div
                  className={cn(
                    'relative flex size-10 items-center justify-center font-bold before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-lg before:bg-black',
                    item.type > 3 && 'pl-2',
                  )}
                  key={`${item.type}-tag`}
                >
                  {item.type <= 3 ? EPISODE_TYPE_MAP[item.type] : '其他'}
                </div>
                <EpisodeGridItem episode={item} key={item.id} />
              </>
            )
          }
          return <EpisodeGridItem episode={item} key={item.id} />
        })}
      </div>
    </div>
  )
}
