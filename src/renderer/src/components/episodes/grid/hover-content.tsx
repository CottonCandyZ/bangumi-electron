import { MediumHeader } from '@renderer/components/base/headers'
import HoverCardContent from '@renderer/components/base/hover-card/content'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import EpisodeCollectionButton from '@renderer/components/collections/episode-collection-button'
import { Separator } from '@renderer/components/ui/separator'
import { CollectionEpisode } from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
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

export default function HoverEpisodeDetail() {
  const hoverCardContent = useAtomValue(hoverCardEpisodeContentAtom)
  if (!hoverCardContent) return null
  const { index, episodes, modifyEpisodeCollectionOpt, collectionType, setEnabledForm } =
    hoverCardContent
  const episode = isCollectionEpisode(episodes) ? episodes[index].episode : episodes[index]
  const duration = getDurationFromSeconds(episode.duration_seconds)
  const [bottom, setBottom] = useState(true)

  return (
    <HoverCardContent
      align="start"
      className="w-fit min-w-64 max-w-96"
      isBottom={(value) => setBottom(value)}
    >
      <div className="flex flex-col gap-2">
        {bottom && isCollectionEpisode(episodes) && (
          <EpisodeCollectionButton
            subjectId={episode.subject_id.toString()}
            index={index}
            modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
            collectionType={collectionType}
            setEnabledForm={setEnabledForm}
          />
        )}
        <div className="flex flex-row flex-wrap gap-x-2">
          <span className="font-bold">ep.{episode.sort}</span>
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
        {!bottom && isCollectionEpisode(episodes) && (
          <EpisodeCollectionButton
            subjectId={episode.subject_id.toString()}
            index={index}
            modifyEpisodeCollectionOpt={modifyEpisodeCollectionOpt}
            collectionType={collectionType}
            setEnabledForm={setEnabledForm}
          />
        )}
      </div>
    </HoverCardContent>
  )
}
