import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import CollectionsGrid from '@renderer/components/collections/grid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { useIsLoginQuery } from '@renderer/data/hooks/session'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useCollectionTypeFilter } from '@renderer/state/collection'

export default function CollectionPanel({ subjectType }: { subjectType: SubjectType }) {
  const isLogin = useIsLoginQuery()
  const { currentTypeFilter, setCurrentTypeFilter } = useCollectionTypeFilter((state) => state)
  const currentSelect = currentTypeFilter.get(subjectType.toString()) ?? CollectionType['watching']

  return (
    <>
      <div className="drag-region flex h-16 items-center justify-end border-b px-5">
        <Select
          onValueChange={(value) =>
            setCurrentTypeFilter(subjectType.toString(), value as unknown as CollectionType)
          }
          value={currentSelect.toString()}
        >
          <SelectTrigger className="no-drag-region w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(CollectionType)
              .slice(0, Object.keys(CollectionType).length / 2)
              .map((item) => (
                <SelectItem value={item.toString()} key={item}>
                  {COLLECTION_TYPE_MAP(subjectType)[item]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
