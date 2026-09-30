import {
  CollectionStatusDot,
  SubjectCollectionSelectorContent,
} from '@renderer/modules/common/collections/subject-select-content'
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
      toast.error('收藏状态更新失败，请重试')
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
      <SelectTrigger
        size="sm"
        className="hover:bg-accent data-popup-open:bg-accent -ml-2 w-fit gap-1 border-none bg-transparent px-2 text-sm font-semibold shadow-none dark:bg-transparent"
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            <CollectionStatusDot type={subjectCollection.type} />
            {COLLECTION_TYPE_MAP(subjectCollection.subject_type)[subjectCollection.type]}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SubjectCollectionSelectorContent subjectType={subjectCollection.subject_type} />
    </Select>
  )
}
