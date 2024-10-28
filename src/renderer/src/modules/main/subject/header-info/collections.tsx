import { CollectionType } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useTheme } from '@renderer/modules/wrapper/theme-wrapper'

export function Collections({ collection, type }: Pick<Subject, 'collection' | 'type'>) {
  const total_collection = Object.values(collection).reduce((cur, acc) => acc + cur, 0)
  const { currentColor } = useTheme()
  const colorValue = currentColor === 'light' ? '60, 60, 60' : '255, 255, 255'
  return (
    <div className="flex w-fit select-none flex-row items-center gap-3 text-sm font-medium">
      <span
        style={{
          borderColor: `rgba(${colorValue}, ${total_collection !== 0 ? collection.wish / total_collection : 0})`,
        }}
        className="border-b-2"
      >
        {collection.wish} {COLLECTION_TYPE_MAP(type)[CollectionType.wantToWatch]}
      </span>
      <span
        style={{
          borderColor: `rgba(${colorValue}, ${total_collection !== 0 ? collection.doing / total_collection : 0})`,
        }}
        className="border-b-2"
      >
        {collection.doing} {COLLECTION_TYPE_MAP(type)[CollectionType.watching]}
      </span>
      <span
        style={{
          borderColor: `rgba(${colorValue}, ${total_collection !== 0 ? collection.collect / total_collection : 0})`,
        }}
        className="border-b-2"
      >
        {collection.collect} {COLLECTION_TYPE_MAP(type)[CollectionType.watched]}
      </span>
      <span
        style={{
          borderColor: `rgba(${colorValue}, ${total_collection !== 0 ? collection.on_hold / total_collection : 0})`,
        }}
        className="border-b-2"
      >
        {collection.on_hold} {COLLECTION_TYPE_MAP(type)[CollectionType.aside]}
      </span>
      <span
        style={{
          borderColor: `rgba(60, 60, 60, ${total_collection !== 0 ? collection.dropped / total_collection : 0})`,
        }}
        className="border-b-2"
      >
        {collection.dropped} {COLLECTION_TYPE_MAP(type)[CollectionType.abandoned]}
      </span>
    </div>
  )
}
