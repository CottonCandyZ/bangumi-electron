import { SubjectCollectionSelectorContent } from '@renderer/modules/common/collections/subject-select-content'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { sidePanelCollectionTypeFilterAtom } from '@renderer/state/collection'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { collectionPanelSubjectTypeAtom } from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'

export function SubjectCollectionPanelHeader() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const [filterMap, setCurrentTypeFilter] = useAtom(sidePanelCollectionTypeFilterAtom)
  const { isLogin } = useSession()
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  const isRefetching = useAtomValue(collectionPanelIsRefetchingAtom)
  return (
    <div className="drag-region flex h-14 shrink-0 flex-row items-center justify-end gap-5 border-b px-2">
      {isLogin && (
        <>
          {isRefetching && <span className="i-mingcute-loading-line animate-spin text-2xl" />}
          <Select
            onValueChange={(value) =>
              setCurrentTypeFilter(subjectType.toString(), Number(value) as CollectionType)
            }
            value={currentSelect.toString()}
          >
            <SelectTrigger className="no-drag-region w-fit justify-end">
              <SelectValue />
            </SelectTrigger>
            <SubjectCollectionSelectorContent subjectType={subjectType} />
          </Select>
        </>
      )}
    </div>
  )
}
