import { SubjectId } from '@renderer/data/types/bgm'
import { useMonoListPanelOpenHandler } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { useCallback } from 'react'

export function useOpenSubjectEpisodesPanel({
  subjectId,
  sourceTitle,
  episodeTotal,
  initialOffset = 0,
}: {
  subjectId: SubjectId | undefined
  sourceTitle?: string
  episodeTotal?: number
  initialOffset?: number
}) {
  const tab = useCallback(() => {
    if (!subjectId) return

    return {
      id: `subject-episodes-${subjectId}`,
      type: 'subjectEpisodes',
      title: '章节',
      sourceTitle: sourceTitle || `条目 ${subjectId}`,
      subjectId,
      episodeTotal,
      initialOffset,
    } as const
  }, [episodeTotal, initialOffset, sourceTitle, subjectId])
  const open = useMonoListPanelOpenHandler(tab)

  return {
    canOpen: !!subjectId,
    open,
    tab,
  }
}
