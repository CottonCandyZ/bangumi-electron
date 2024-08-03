import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import CollectionsGrid from '@renderer/components/collections/grid'
import SubjectCollectionSelectorContent from '@renderer/components/collections/subject-select-content'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useSession } from '@renderer/components/wrapper/session-wrapper'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { useCollectionTypeFilter } from '@renderer/state/collection'

export default function CollectionPanel({ subjectType }: { subjectType: SubjectType }) {
  const { isLogin } = useSession()
  const { currentTypeFilter, setCurrentTypeFilter } = useCollectionTypeFilter((state) => state)
  const currentSelect = currentTypeFilter.get(subjectType.toString()) ?? CollectionType['watching']

  return (
    <>
      <div className="drag-region flex h-16 items-center justify-end border-b px-5">
        {isLogin && (
          <Select
            onValueChange={(value) =>
              setCurrentTypeFilter(subjectType.toString(), Number(value) as CollectionType)
            }
            value={currentSelect.toString()}
          >
            <SelectTrigger className="no-drag-region w-fit">
              <SelectValue />
            </SelectTrigger>
            <SubjectCollectionSelectorContent subjectType={subjectType} />
          </Select>
        )}
      </div>
      {isLogin && (
        <ScrollWrapper
          className={cn('h-[calc(100dvh-72px)] shrink-0 overflow-x-hidden bg-background p-1')}
          options={{ scrollbars: { autoHide: 'scroll' } }}
        >
          <CollectionsGrid subjectType={subjectType} collectionType={currentSelect} />
        </ScrollWrapper>
      )}
    </>
  )
}
