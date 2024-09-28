import { SubjectCollectionSelectorContent } from '@renderer/modules/shared/collections/subject-select-content'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function SubjectCollectionSelector({
  subjectCollection,
}: {
  subjectCollection: CollectionData
}) {
  const queryClient = useQueryClient()
  const { userInfo, accessToken } = useSession()
  const username = userInfo?.username
  const queryKey = [
    'collection-subject',
    { subjectId: subjectCollection.subject_id.toString(), username },
    accessToken,
  ]
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess(_, variable) {
      toast.success(
        `已标记成 ${COLLECTION_TYPE_MAP(subjectCollection.subject_type)[variable.collectionType!]}`,
      )
    },
    onMutate(variable) {
      queryClient.cancelQueries({ queryKey })
      const pre = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, {
        ...subjectCollection,
        type: variable.collectionType!,
      } satisfies CollectionData)
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      queryClient.setQueryData(queryKey, (context as { pre: CollectionData }).pre)
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
    >
      <SelectTrigger className="w-fit bg-background font-medium">
        <SelectValue />
      </SelectTrigger>
      <SubjectCollectionSelectorContent subjectType={subjectCollection.subject_type} />
    </Select>
  )
}
