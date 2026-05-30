import { SubjectId } from '@renderer/data/types/bgm'
import { useOpenMonoListPanelTab } from '@renderer/modules/panel/left-panel/use-open-mono-list-panel-tab'
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
  const openMonoListPanelTab = useOpenMonoListPanelTab()

  const open = useCallback(() => {
    if (!subjectId) return

    openMonoListPanelTab({
      id: `subject-episodes-${subjectId}`,
      type: 'subjectEpisodes',
      title: '章节',
      sourceTitle: sourceTitle || `条目 ${subjectId}`,
      subjectId,
      episodeTotal,
      initialOffset,
    })
  }, [episodeTotal, initialOffset, openMonoListPanelTab, sourceTitle, subjectId])

  return {
    canOpen: !!subjectId,
    open,
  }
}
