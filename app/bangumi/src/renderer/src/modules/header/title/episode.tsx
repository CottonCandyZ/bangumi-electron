import { Button } from '@renderer/components/ui/button'
import {
  useEpisodeInfoByIdQuery,
  useEpisodesInfoBySubjectIdQuery,
} from '@renderer/data/hooks/api/episodes'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { EpId } from '@renderer/data/types/bgm'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'

export function EpisodeHeaderTitle({ episodeId }: { episodeId: EpId }) {
  const episodeQuery = useEpisodeInfoByIdQuery({ episodeId })
  const episode = episodeQuery.data
  const subjectInfoQuery = useSubjectInfoQuery({
    subjectId: episode?.subject_id.toString(),
    enabled: !!episode,
    needKeepPreviousData: false,
  })
  const subjectInfo = subjectInfoQuery.data
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId: episode?.subject_id.toString() ?? '',
    limit: 100,
    enabled: !!episode,
  })
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  if (!episode) return null

  return (
    <div className="flex min-w-0 flex-row items-center gap-2">
      <StaticHeaderTitle
        image={subjectInfo?.images.common}
        imageFallback={`ep.${episode.sort}`}
        name={episode.name}
        nameCn={episode.name_cn || `ep.${episode.sort}`}
      />
      {episodesQuery.data?.data && (
        <Button
          variant="ghost"
          size="icon"
          className="no-drag-region size-8 shrink-0"
          onClick={() =>
            openMonoListPanelTab({
              id: `subject-episodes-${episode.subject_id}`,
              type: 'subjectEpisodes',
              title: '章节',
              sourceTitle:
                subjectInfo?.name_cn || subjectInfo?.name || `条目 ${episode.subject_id}`,
              subjectId: episode.subject_id.toString(),
              episodes: episodesQuery.data.data ?? [],
            })
          }
        >
          <span className="i-mingcute-box-3-line text-lg" />
        </Button>
      )}
    </div>
  )
}
