import { SearchFilterPanel } from '@renderer/modules/panel/right-panel/panels/search-filter-panel'
import { SubjectInfoPanel } from '@renderer/modules/panel/right-panel/panels/subject-info'
import { UserTimelinePanel } from '@renderer/modules/panel/right-panel/panels/user-timeline'
import type { RightPanelContent } from '@renderer/state/panel'

export function RightPanel({ content }: { content: RightPanelContent | null }) {
  if (content === 'userTimeline') return <UserTimelinePanel />
  if (content === 'subjectInfo') return <SubjectInfoPanel />
  if (content === 'searchFilter') return <SearchFilterPanel />
  return null
}
