import { RateButtons } from '@renderer/modules/shared/collections/rate'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function QuickRate({ subjectCollection }: { subjectCollection: CollectionData }) {
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
    onSuccess() {
      toast.success(subjectCollection.rate !== 0 ? '评分成功！' : '移除成功！')
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      queryClient.setQueryData(queryKey, (context as { pre: CollectionData }).pre)
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey,
      })
      const pre = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, {
        ...subjectCollection,
        rate: variable.rate!,
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
