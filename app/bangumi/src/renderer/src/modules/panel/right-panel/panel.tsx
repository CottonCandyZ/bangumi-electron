import { SearchFilterPanel } from '@renderer/modules/panel/right-panel/panels/search-filter-panel'
import { SubjectInfoPanel } from '@renderer/modules/panel/right-panel/panels/subject-info'
import { UserTimelinePanel } from '@renderer/modules/panel/right-panel/panels/user-timeline'
import { useLocation } from 'react-router-dom'

export function RightPanel() {
  const { pathname } = useLocation()
  if (pathname.includes('profile') || pathname.includes('user')) return <UserTimelinePanel />

  return pathname.includes('subject') ? (
    <SubjectInfoPanel />
  ) : (
    pathname.includes('search') && <SearchFilterPanel />
  )
}
