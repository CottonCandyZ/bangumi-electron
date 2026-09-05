import { RateButtons } from '@renderer/modules/common/collections/rate'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { toast } from 'sonner'

export function QuickRate({ subjectCollection }: { subjectCollection: CollectionData }) {
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success('评分已保存到本地')
    },
    onError(error) {
      toast.error(error.message || '保存到本地失败')
    },
  })
  return (
    <RateButtons
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
