import SubjectInfoPanel from '@renderer/components/panel/right-panel/panels/subject-info'
import { rightPanelOpenContentAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export default function RightPanel() {
  const panelName = useAtomValue(rightPanelOpenContentAtom)
  return panelName === 'subjectInfo' && <SubjectInfoPanel />
}
