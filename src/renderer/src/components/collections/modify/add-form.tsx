import AddOrModifySubjectCollectionForm from '@renderer/components/collections/modify/form'
import { CollectionType } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'

export default function AddSubjectCollectionForm({
  subjectInfo,
  collectionType,
}: {
  subjectInfo: Subject
  collectionType: CollectionType
}) {
  return (
    <AddOrModifySubjectCollectionForm
      collectionType={collectionType}
      subjectType={subjectInfo.type}
      subjectTags={subjectInfo.tags}
    />
  )
}
