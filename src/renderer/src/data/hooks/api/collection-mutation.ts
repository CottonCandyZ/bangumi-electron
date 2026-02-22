import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { UserInfo } from '@renderer/data/types/user'
import { useQueryClient } from '@tanstack/react-query'

export function useSubjectCollectionTypeMutation({
  subjectId,
  username,
  onSuccess,
  onError,
}: {
  subjectId: SubjectId
  username: UserInfo['username'] | undefined
  onSuccess?: (collectionType: CollectionType) => void
  onError?: () => void
}) {
  const queryClient = useQueryClient()
  const queryKey = ['collection-subject', { subjectId, username }] as const

  return useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess(_data, variable) {
      if (variable.collectionType !== undefined) {
        onSuccess?.(variable.collectionType)
      }
    },
    onMutate(variable) {
      queryClient.cancelQueries({ queryKey })
      const pre = queryClient.getQueryData<CollectionData | null>(queryKey)
      if (pre && variable.collectionType !== undefined) {
        queryClient.setQueryData<CollectionData>(queryKey, {
          ...pre,
          type: variable.collectionType,
        })
      }
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['collection-subjects'] })
    },
    onError(_error, _variable, context) {
      const pre = (context as { pre: CollectionData | null } | undefined)?.pre
      if (pre !== undefined) {
        queryClient.setQueryData(queryKey, pre)
      }
      onError?.()
    },
  })
}
