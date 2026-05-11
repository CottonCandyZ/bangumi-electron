import { CollectionsGrid } from '@renderer/modules/common/collections/grid'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import {
  sidePanelCollectionTypeFilterAtom,
  sidePanelShowEpisodeListAtom,
} from '@renderer/state/collection'
import { collectionPanelSubjectTypeAtom, collectionPanelUsernameAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function SubjectCollectionPanelContent() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const filterMap = useAtomValue(sidePanelCollectionTypeFilterAtom)
  const showEpisodeList = useAtomValue(sidePanelShowEpisodeListAtom)
  const userInfo = useSession()
  const panelUsername = useAtomValue(collectionPanelUsernameAtom)
  const username = panelUsername ?? userInfo?.username
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  return (
    !!username && (
      <CollectionsGrid
        username={username}
        subjectType={subjectType}
        collectionType={currentSelect}
        showEpisodeList={showEpisodeList}
      />
    )
  )
}
