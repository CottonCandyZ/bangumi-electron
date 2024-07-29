import CollectionPanel from '@renderer/components/panel/collection-panel'
import { SubjectType } from '@renderer/data/types/subject'

import { PanelName } from '@renderer/state/panel'

export default function SidePanel({ currentPanelName }: { currentPanelName: PanelName }) {
  return <CollectionPanel subjectType={SubjectType[currentPanelName]} />
}
