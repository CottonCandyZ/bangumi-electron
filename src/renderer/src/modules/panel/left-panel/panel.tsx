import { CollectionPanel } from '@renderer/modules/panel/left-panel/panels/collection-panel'
import { leftPanelOpenContentAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function LeftPanel() {
  const panelName = useAtomValue(leftPanelOpenContentAtom)
  return panelName === 'collection' && <CollectionPanel />
}
