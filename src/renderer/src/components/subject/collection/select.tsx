import SubjectCollectionSelectorContent from '@renderer/components/collections/subject-select-content'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'
import {} from '@renderer/data/types/user'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function SubjectCollectionSelector({
  subjectCollection,
  username,
  accessToken,
}: {
  subjectCollection: CollectionData
} & ModifyCollectionOptType) {
  const queryClient = useQueryClient()
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess(_, variable) {
      toast.success(
        `已标记成 ${COLLECTION_TYPE_MAP(subjectCollection.subject_type)[variable.collectionType!]}`,
      )
    },
    onMutate(variable) {
      queryClient.setQueryData(
        [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
        { ...subjectCollection, tags: variable.tags },
      )
      queryClient.setQueryData(
        [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
        { ...subjectCollection, type: variable.collectionType! } satisfies CollectionData,
      )
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username, accessToken },
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
    onError() {
      toast.error('呀，出了点错误...')
    },
  })

  return (
    <Select
      value={subjectCollection.type.toString()}
      onValueChange={(value) => {
        subjectCollectionMutation.mutate({
          subjectId: subjectCollection.subject_id.toString(),
          collectionType: Number(value) as CollectionType,
        })
      }}
      disabled={subjectCollectionMutation.isPending}
    >
      <SelectTrigger className="w-fit bg-background font-medium">
        <SelectValue />
      </SelectTrigger>
      <SubjectCollectionSelectorContent subjectType={subjectCollection.subject_type} />
    </Select>
  )
}