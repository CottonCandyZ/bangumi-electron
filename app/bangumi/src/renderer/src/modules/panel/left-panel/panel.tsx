import { CollectionPanel } from '@renderer/modules/panel/left-panel/panels/collection-panel'
import { MonoListPanel } from '@renderer/modules/panel/left-panel/panels/mono-list-panel'
import { leftPanelOpenContentAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function LeftPanel() {
  const panelName = useAtomValue(leftPanelOpenContentAtom)
  if (panelName === 'collection') return <CollectionPanel />
  if (panelName === 'monoList') return <MonoListPanel />
  return null
}
