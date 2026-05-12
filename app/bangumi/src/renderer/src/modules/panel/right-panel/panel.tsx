import { SearchFilterPanel } from '@renderer/modules/panel/right-panel/panels/search-filter-panel'
import { SubjectInfoPanel } from '@renderer/modules/panel/right-panel/panels/subject-info'
import { UserTimelinePanel } from '@renderer/modules/panel/right-panel/panels/user-timeline'
import { getRightPanelContentByPathname } from '@renderer/state/panel'
import { useLocation } from 'react-router-dom'

export function RightPanel() {
  const { pathname } = useLocation()
  const content = getRightPanelContentByPathname(pathname)

  if (content === 'userTimeline') return <UserTimelinePanel />
  if (content === 'subjectInfo') return <SubjectInfoPanel />
  if (content === 'searchFilter') return <SearchFilterPanel />
  return null
}
