import { RateButtons } from '@renderer/modules/common/collections/rate'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { toast } from 'sonner'

export function QuickRate({ subjectCollection }: { subjectCollection: CollectionData }) {
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onError(error) {
      toast.error(error.message || '评分更新失败，请重试')
    },
  })
  return (
    <RateButtons
      rate={subjectCollection.rate}
      disabled={subjectCollectionMutation.isPending}
      onRateChanged={(value) => {
        subjectCollectionMutation.mutate({
          subjectId: subjectCollection.subject_id.toString(),
          rate: value,
        })
      }}
    />
  )
}
