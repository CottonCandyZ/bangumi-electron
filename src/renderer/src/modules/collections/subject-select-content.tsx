import { SelectContent, SelectItem } from '@renderer/components/ui/select'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'

export function SubjectCollectionSelectorContent({ subjectType }: { subjectType: SubjectType }) {
  return (
    <SelectContent>
      {Object.keys(CollectionType)
        .slice(0, Object.keys(CollectionType).length / 2)
        .map((item) => (
          <SelectItem value={item.toString()} key={item}>
            {COLLECTION_TYPE_MAP(subjectType)[item]}
          </SelectItem>
        ))}
    </SelectContent>
  )
}
