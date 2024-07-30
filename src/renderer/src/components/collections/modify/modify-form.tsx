import AddOrModifySubjectCollectionForm from '@renderer/components/collections/modify/form'
import { CollectionData } from '@renderer/data/types/collection'

export default function ModifySubjectCollectionForm({
  collectionData,
}: {
  collectionData: CollectionData
}) {
  return (
    <AddOrModifySubjectCollectionForm
      collectionType={collectionData.type}
      subjectType={collectionData.subject_type}
      comment={collectionData.comment ?? ''}
      isPrivate={collectionData.private}
      tags={collectionData.tags}
    />
  )
}
