import { CollectionsGrid } from '@renderer/modules/common/collections/grid'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { sidePanelCollectionTypeFilterAtom } from '@renderer/state/collection'
import { collectionPanelSubjectTypeAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function SubjectCollectionPanelContent() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const filterMap = useAtomValue(sidePanelCollectionTypeFilterAtom)
  const userInfo = useSession()
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  return !!userInfo && <CollectionsGrid subjectType={subjectType} collectionType={currentSelect} />
}
