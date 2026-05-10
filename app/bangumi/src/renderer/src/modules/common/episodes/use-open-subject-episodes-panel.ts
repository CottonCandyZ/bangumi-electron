import { SubjectId } from '@renderer/data/types/bgm'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
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
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

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
