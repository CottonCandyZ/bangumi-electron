import SubjectCollectionPanelContent from '@renderer/components/panel/left-panel/panels/collction-panel/content'
import SubjectCollectionPanelHeader from '@renderer/components/panel/left-panel/panels/collction-panel/header'

export default function CollectionPanel() {
  return (
    <div className="flex h-dvh flex-col">
      <SubjectCollectionPanelHeader />
      <SubjectCollectionPanelContent />
    </div>
  )
}
