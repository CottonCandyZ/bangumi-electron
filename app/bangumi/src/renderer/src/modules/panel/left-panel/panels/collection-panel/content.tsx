import { CollectionsGrid } from '@renderer/modules/common/collections/grid'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import {
  sidePanelCollectionTypeFilterAtom,
  sidePanelOneBasedEpisodeSortAtom,
  sidePanelShowEpisodeListAtom,
} from '@renderer/state/collection'
import { collectionPanelSubjectTypeAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function SubjectCollectionPanelContent({ username }: { username: string }) {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const filterMap = useAtomValue(sidePanelCollectionTypeFilterAtom)
  const showEpisodeList = useAtomValue(sidePanelShowEpisodeListAtom)
  const useOneBasedEpisodeSort = useAtomValue(sidePanelOneBasedEpisodeSortAtom)
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']

  return (
    <CollectionsGrid
      username={username}
      subjectType={subjectType}
      collectionType={currentSelect}
      showEpisodeList={showEpisodeList}
      useOneBasedEpisodeSort={useOneBasedEpisodeSort}
    />
  )
}
