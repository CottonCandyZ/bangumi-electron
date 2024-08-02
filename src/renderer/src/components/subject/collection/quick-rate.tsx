import RateButtons from '@renderer/components/collections/rate'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function QuickRate({
  subjectCollection,
  username,
  accessToken,
}: {
  subjectCollection: CollectionData
} & ModifyCollectionOptType) {
  const queryClient = useQueryClient()
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success(subjectCollection.rate !== 0 ? '评分成功！' : '移除成功！')
    },
    onError() {
      toast.error('呀，出了点错误...')
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey: [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
      })
      queryClient.setQueryData(
        [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
        { ...subjectCollection, rate: variable.rate! } satisfies CollectionData,
      )
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
  })
  return (
    <RateButtons
      disabled={subjectCollectionMutation.isPending}
      rate={subjectCollection.rate}
      onRateChanged={(value) => {
        subjectCollectionMutation.mutate({
          subjectId: subjectCollection.subject_id.toString(),
          rate: value,
        })
      }}
    />
  )
}
