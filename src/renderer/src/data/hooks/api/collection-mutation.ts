import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { UserInfo } from '@renderer/data/types/user'
import { SubjectType } from '@renderer/data/types/subject'
import { useQueryClient } from '@tanstack/react-query'
import { useQueryKeyWithUserId } from '@renderer/data/hooks/factory'

function createOptimisticCollectionData({
  subjectId,
  subjectType,
  collectionType,
}: {
  subjectId: SubjectId
  subjectType: SubjectType
  collectionType: CollectionType
}): CollectionData {
  const numericSubjectId = Number(subjectId)
  return {
    updated_at: new Date().toISOString(),
    comment: null,
    tags: [],
    subject: {
      id: Number.isNaN(numericSubjectId) ? 0 : numericSubjectId,
      type: subjectType,
      name: '',
      name_cn: '',
      date: null,
      images: {
        small: '',
        grid: '',
        large: '',
        medium: '',
        common: '',
      },
      tags: [],
      eps: 0,
      volumes: 0,
      score: 0,
      rank: 0,
      collection_total: 0,
    },
    subject_id: Number.isNaN(numericSubjectId) ? 0 : numericSubjectId,
    vol_status: 0,
    ep_status: 0,
    subject_type: subjectType,
    type: collectionType,
    rate: 0,
    private: false,
  }
}

export function useSubjectCollectionTypeMutation({
  subjectId,
  subjectType,
  username,
  onSuccess,
  onError,
}: {
  subjectId: SubjectId
  subjectType: SubjectType
  username: UserInfo['username'] | undefined
  onSuccess?: (collectionType: CollectionType) => void
  onError?: () => void
}) {
  const queryClient = useQueryClient()
  const queryKey = useQueryKeyWithUserId(['collection-subject', { subjectId, username }])

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
      if (variable.collectionType !== undefined) {
        if (pre) {
          queryClient.setQueryData<CollectionData>(queryKey, {
            ...pre,
            type: variable.collectionType,
          })
        } else {
          queryClient.setQueryData<CollectionData>(
            queryKey,
            createOptimisticCollectionData({
              subjectId,
              subjectType,
              collectionType: variable.collectionType,
            }),
          )
        }
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
