import { SubjectCollectionPanelContent } from '@renderer/modules/panel/left-panel/panels/collection-panel/content'
import { SubjectCollectionPanelHeader } from '@renderer/modules/panel/left-panel/panels/collection-panel/header'

export function CollectionPanel() {
  return (
    <div className="flex h-dvh flex-col">
      <SubjectCollectionPanelHeader />
      <SubjectCollectionPanelContent />
    </div>
  )
}
