import SubjectInfoPanel from '@renderer/components/panel/right-panel/panels/subject-info'
import { useLocation } from 'react-router-dom'

export default function RightPanel() {
  const { pathname } = useLocation()
  return pathname.includes('subject') && <SubjectInfoPanel />
}
