import { useMutationSubjectCollection } from './collection'
import type { SubjectId } from '@renderer/data/types/bgm'
import type { CollectionType } from '@renderer/data/types/collection'
import type { UserInfo } from '@renderer/data/types/user'
import type { SubjectType } from '@renderer/data/types/subject'
export function useSubjectCollectionTypeMutation({
  onSuccess,
  onError,
}: {
  subjectId: SubjectId
  subjectType: SubjectType
  username: UserInfo['username'] | undefined
  onSuccess?: (collectionType: CollectionType) => void
  onError?: () => void
}) {
  return useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess(_data, variable) {
      if (variable.collectionType !== undefined) onSuccess?.(variable.collectionType)
    },
    onError() {
      onError?.()
    },
  })
}
