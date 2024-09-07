import SearchFilterPanel from '@renderer/modules/panel/right-panel/panels/search-filter-panel'
import SubjectInfoPanel from '@renderer/modules/panel/right-panel/panels/subject-info'
import { useLocation } from 'react-router-dom'

export default function RightPanel() {
  const { pathname } = useLocation()
  return pathname.includes('subject') ? (
    <SubjectInfoPanel />
  ) : (
    pathname.includes('search') && <SearchFilterPanel />
  )
}
