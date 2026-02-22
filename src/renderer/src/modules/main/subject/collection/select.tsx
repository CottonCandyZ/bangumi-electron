import { SubjectCollectionSelectorContent } from '@renderer/modules/common/collections/subject-select-content'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { toast } from 'sonner'
import { useSubjectCollectionTypeMutation } from '@renderer/data/hooks/api/collection-mutation'

export function SubjectCollectionSelector({
  subjectCollection,
}: {
  subjectCollection: CollectionData
}) {
  const username = useSessionUsername()
  const subjectCollectionMutation = useSubjectCollectionTypeMutation({
    subjectId: subjectCollection.subject_id.toString(),
    subjectType: subjectCollection.subject_type,
    username,
    onSuccess(collectionType) {
      toast.success(
        `已标记成 ${COLLECTION_TYPE_MAP(subjectCollection.subject_type)[collectionType]}`,
      )
    },
    onError() {
      toast.error('呀，出了点错误...')
    },
  })

  return (
    <Select
      value={subjectCollection.type.toString()}
      disabled={subjectCollectionMutation.isPending}
      onValueChange={(value) => {
        subjectCollectionMutation.mutate({
          subjectId: subjectCollection.subject_id.toString(),
          collectionType: Number(value) as CollectionType,
        })
      }}
    >
      <SelectTrigger className="bg-background w-fit font-medium">
        <SelectValue />
      </SelectTrigger>
      <SubjectCollectionSelectorContent subjectType={subjectCollection.subject_type} />
    </Select>
  )
}
