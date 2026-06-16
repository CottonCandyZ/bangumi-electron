import { MyLink } from '@renderer/components/my-link'
import { useEpisodeInfoByIdQuery } from '@renderer/data/hooks/api/episodes'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { EpId } from '@renderer/data/types/bgm'
import { useOpenSubjectEpisodesPanel } from '@renderer/modules/common/episodes/use-open-subject-episodes-panel'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { CornerUpLeft } from 'lucide-react'

export function EpisodeHeaderTitle({ episodeId }: { episodeId: EpId }) {
  const episodeQuery = useEpisodeInfoByIdQuery({ episodeId })
  const episode = episodeQuery.data
  const subjectInfoQuery = useSubjectInfoQuery({
    subjectId: episode?.subject_id.toString(),
    enabled: !!episode,
    needKeepPreviousData: false,
  })
  const subjectInfo = subjectInfoQuery.data
  const subjectId = episode?.subject_id.toString()
  const episodesPanel = useOpenSubjectEpisodesPanel({
    subjectId,
    sourceTitle: subjectInfo?.name_cn || subjectInfo?.name || `条目 ${subjectId}`,
    episodeTotal: subjectInfo?.total_episodes,
    initialOffset: getEpisodeInitialOffset(episode?.sort),
  })

  if (!episode) return null

  return (
    <div className="flex min-w-0 flex-row items-center gap-2">
      <StaticHeaderTitle
        image={subjectInfo?.images.common}
        imageOverlay={
          subjectId ? (
            <MyLink
              to={`/subject/${subjectId}`}
              aria-label="返回原条目"
              className="no-drag-region absolute inset-0 flex cursor-default items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
            >
              <CornerUpLeft className="size-4" />
            </MyLink>
          ) : undefined
        }
        imageFallback={`ep.${episode.sort}`}
        name={episode.name}
        nameCn={episode.name_cn || `ep.${episode.sort}`}
      />
      {episodesPanel.canOpen && (
        <OpenMonoListPanelButton
          className="no-drag-region size-8 shrink-0"
          tab={episodesPanel.tab}
          title="在侧栏打开章节"
        />
      )}
    </div>
  )
}

function getEpisodeInitialOffset(sort: number | undefined) {
  if (!sort || sort <= 1) return 0
  return Math.floor((sort - 1) / 100) * 100
}
