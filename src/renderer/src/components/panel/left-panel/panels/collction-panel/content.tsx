import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import CollectionsGrid from '@renderer/components/collections/grid'
import { useSession } from '@renderer/components/wrapper/session-wrapper'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { sidePanelCollectionTypeFilterAtom } from '@renderer/state/collection'
import { collectionPanelSubjectTypeAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export default function SubjectCollectionPanelContent() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const filterMap = useAtomValue(sidePanelCollectionTypeFilterAtom)
  const { isLogin } = useSession()
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  return (
    isLogin && (
      <ScrollWrapper
        className={cn(
          'scroll h-[calc(100dvh-72px)] shrink-0 overflow-x-hidden bg-background p-1 pr-0.5',
        )}
        // options={{ scrollbars: { autoHide: 'scroll' } }}
      >
        <CollectionsGrid subjectType={subjectType} collectionType={currentSelect} />
      </ScrollWrapper>
    )
  )
}
