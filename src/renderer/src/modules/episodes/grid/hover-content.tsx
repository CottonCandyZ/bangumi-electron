import { MediumHeader } from '@renderer/components/headers'
import { HoverCardContent } from '@renderer/components/hover-card/content'
import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { EpisodeCollectionButton } from '@renderer/modules/collections/episode-collection-button'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useQuerySubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { getDurationFromSeconds } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { hoverCardEpisodeContentAtom } from '@renderer/state/hover-card'
import { useAtomValue } from 'jotai'
import { useState } from 'react'

function isCollectionEpisode(
  episodes: Episode[] | CollectionEpisode[],
): episodes is CollectionEpisode[] {
  return (episodes as CollectionEpisode[])[0].episode !== undefined
}

export type HoverEpisodeDetailType = {
  id: 'episode-content'
  index: number
  episodes: Episode[] | CollectionEpisode[]
  collectionType: CollectionType | undefined
  setEnabledForm: (enabled: boolean) => void
} & ModifyEpisodeCollectionOptType

export function HoverEpisodeDetail() {
  const hoverCardContent = useAtomValue(hoverCardEpisodeContentAtom)
  if (!hoverCardContent) return null
  const { index, episodes, modifyEpisodeCollectionOpt, collectionType, setEnabledForm } =
    hoverCardContent
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const duration = getDurationFromSeconds(episode.duration_seconds)
  const [bottom, setBottom] = useState(true)
  const { userInfo } = useSession()
  const username = userInfo?.username
  const subjectCollectionQuery = useQuerySubjectCollection({
    subjectId: episode.subject_id.toString(),
    username,
    enabled: !!userInfo && !!collectionType,
    needKeepPreviousData: false,
  })
  const subjectCollection = subjectCollectionQuery.data
  const subjectCollectionType = collectionType ?? subjectCollection?.type

  return (
    <HoverCardContent align="start" isBottom={(value) => setBottom(value)}>
      <div
        className={cn(
          'flex min-w-64 max-w-96 flex-col gap-2 px-4',
          isCollectionEpisode(episodes) &&
            (subjectCollection === undefined || subjectCollectionType === CollectionType.watching)
            ? bottom
              ? 'pb-4'
              : 'pt-4'
            : 'py-4',
        )}
      >
        {bottom &&
          isCollectionEpisode(episodes) &&
          (subjectCollection === undefined ? (
            <div className="sticky top-0 bg-background pb-2 pt-4">
              <Skeleton className="h-9 w-52" />
            </div>
          ) : (
            subjectCollection !== null &&
            subjectCollectionType === CollectionType.watching && (
              <div className="sticky top-0 bg-background pb-2 pt-4">
                <EpisodeCollectionButton
                  subjectType={subjectCollection.subject_type}
                  subjectId={episode.subject_id.toString()}
                  index={index}
                  modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                  setEnabledForm={setEnabledForm}
                />
              </div>
            )
          ))}
        <div className="flex flex-row gap-x-2">
          <span className="font-semibold">ep.{episode.sort}</span>
          {!isEmpty(episode.name) && <MediumHeader {...episode} />}
        </div>
        {!isEmpty(episode.desc) && (
          <>
            <ScrollWrapper className="max-h-32 pr-2">
              <p className="whitespace-pre-wrap">{episode.desc}</p>
            </ScrollWrapper>
            <Separator />
          </>
        )}
        {!isEmpty(episode.airdate) && <span className="text-sm">首播：{episode.airdate}</span>}
        {!isEmpty(episode.duration) && (
          <span className="text-sm">
            时长：
            {`${duration.hours.toString().padStart(2, '0')} :
            ${duration.mins.toString().padStart(2, '0')} : ${duration.seconds.toString().padStart(2, '0')}`}
          </span>
        )}

        <span className="text-sm">讨论：{episode.comment}</span>
        {!bottom &&
          isCollectionEpisode(episodes) &&
          (subjectCollection === undefined ? (
            <div className="sticky bottom-0 z-0 bg-background pb-4 pt-2">
              <Skeleton className="h-9 w-52" />
            </div>
          ) : (
            subjectCollection !== null &&
            subjectCollectionType === CollectionType.watching && (
              <div className="sticky bottom-0 z-0 bg-background pb-4 pt-2">
                <EpisodeCollectionButton
                  subjectType={subjectCollection.subject_type}
                  subjectId={episode.subject_id.toString()}
                  index={index}
                  modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
                  setEnabledForm={setEnabledForm}
                />
              </div>
            )
          ))}
      </div>
    </HoverCardContent>
  )
}
