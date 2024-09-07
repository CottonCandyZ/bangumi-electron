import { SubjectCollectionPanelContent } from '@renderer/modules/panel/left-panel/panels/collction-panel/content'
import { SubjectCollectionPanelHeader } from '@renderer/modules/panel/left-panel/panels/collction-panel/header'

export function CollectionPanel() {
  return (
    <div className="flex h-dvh flex-col">
      <SubjectCollectionPanelHeader />
      <SubjectCollectionPanelContent />
    </div>
  )
}
