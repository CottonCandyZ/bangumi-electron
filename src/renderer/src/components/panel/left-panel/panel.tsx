import CollectionPanel from '@renderer/components/panel/left-panel/panels/collction-panel'
import { leftPanelOpenContentAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export default function LeftPanel() {
  const panelName = useAtomValue(leftPanelOpenContentAtom)
  return panelName === 'collection' && <CollectionPanel />
}
