import { EpisodeGridSize } from '@renderer/modules/episodes/grid/index'
import EpisodeGridItem from '@renderer/modules/episodes/grid/item'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode, EpisodeType } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { subjectCollectionSheetFormActionAtom } from '@renderer/state/sheet'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { toast } from 'sonner'

function isCollectionEpisode(episode: Episode | CollectionEpisode): episode is CollectionEpisode {
  return (episode as CollectionEpisode).episode !== undefined
}
export function EpisodeGridContent({
  episodes,
  size = 'default',
  modifyEpisodeCollectionOpt,
  collectionType,
  subjectId,
}: {
  subjectId: SubjectId
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
} & EpisodeGridSize &
  ModifyEpisodeCollectionOptType) {
  let firstTime = Array(7).fill(true) // 用来显示不同种类的数组, type 字段
  firstTime[0] = false // 本篇就不显示了
  const { userInfo } = useSession()
  const username = userInfo?.username
  const [enabled, setEnabled] = useState(false)
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId,
    username,
    enabled: !!userInfo && enabled,
    needKeepPreviousData: false,
  })
  const subjectCollection = subjectCollectionQuery.data
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false, enabled })
  const subjectInfo = subjectInfoQuery.data
  const sheetAction = useSetAtom(subjectCollectionSheetFormActionAtom)
  /** 在严格模式下会跑两次，所以让我们用 Effect 包裹它吧 */
  useEffect(() => {
    if (subjectCollection && subjectInfo && enabled) {
      if (
        subjectCollection.ep_status === subjectInfo.eps &&
        subjectCollectionQuery.fetchStatus === 'idle' &&
        subjectInfoQuery.fetchStatus === 'idle'
      ) {
        toast('观察到你已经看完了', {
          action: {
            label: '标记',
            onClick: () => {
              sheetAction({
                sheetTitle: '修改收藏',
                collectionType: CollectionType.watched,
                subjectId: subjectCollection.subject_id.toString(),
                subjectTags: subjectInfo.tags,
                subjectType: subjectCollection.subject_type,
                comment: subjectCollection.comment ?? '',
                isPrivate: subjectCollection.private,
                rate: subjectCollection.rate,
                tags: subjectCollection.tags,
                modify: true,
              })
            },
          },
        })
        setEnabled(false)
      } else {
        if (
          subjectCollectionQuery.fetchStatus === 'idle' &&
          subjectInfoQuery.fetchStatus === 'idle'
        ) {
          setEnabled(false)
        }
      }
    }
  }, [
    subjectCollection,
    subjectInfo,
    enabled,
    subjectCollectionQuery.fetchStatus,
    subjectInfoQuery.fetchStatus,
  ])

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
                  'relative flex h-10 min-w-10 items-center justify-center border border-transparent font-bold before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-lg before:bg-primary',
                  size === 'small' &&
                    'h-6 min-w-6 pl-1 text-xs font-normal before:bottom-1 before:left-[1px] before:top-1 before:w-[2.5px]',
                  item.type > 3 && 'pl-2',
                )}
                key={`${item.type}-tag`}
              >
                {item.type <= 3 ? EpisodeType[item.type] : '其他'}
              </div>
              <EpisodeGridItem
                key={item.id}
                size={size}
                index={index}
                episodes={episodes}
                modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                collectionType={collectionType}
                setEnabledForm={setEnabled}
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
            setEnabledForm={setEnabled}
          />
        )
      })}
    </div>
  )
}
