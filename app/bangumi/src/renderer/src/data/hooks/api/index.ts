import {
  createIndex,
  createIndexRelated,
  deleteIndex,
  deleteIndexRelated,
  getIndexById,
  getIndexComments,
  getIndexRelated,
  updateIndex,
  updateIndexRelated,
} from '@renderer/data/fetch/api/index'
import { useCharacterIndexesQuery } from '@renderer/data/hooks/api/character'
import { usePersonIndexesQuery } from '@renderer/data/hooks/api/person'
import { useSubjectIndexesQuery } from '@renderer/data/hooks/api/subject'
import {
  useAuthQuery,
  useInfinityQueryOptionalAuth,
  useMutationMustAuth,
} from '@renderer/data/hooks/factory'
import type { IndexRelatedCategory, IndexResourceType } from '@renderer/data/types/index'
import type { SubjectType } from '@renderer/data/types/subject'
import { useQueryClient } from '@tanstack/react-query'

const INDEX_DETAIL_STALE_TIME = 1000 * 60

export const useIndexQuery = ({
  enabled,
  indexId,
}: {
  enabled?: boolean
  indexId: number | undefined
}) =>
  useAuthQuery({
    queryFn: getIndexById,
    queryKey: ['index-detail'],
    queryProps: { indexId },
    enabled,
    staleTime: INDEX_DETAIL_STALE_TIME,
  })

export const useIndexRelatedQuery = ({
  cat,
  enabled,
  indexId,
  limit = 20,
  type,
}: {
  cat?: IndexRelatedCategory
  enabled?: boolean
  indexId: number | undefined
  limit?: number
  type?: SubjectType
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getIndexRelated,
    queryKey: ['index-related'],
    queryProps: { indexId, cat, type },
    qFLimit: limit,
    enabled,
    needKeepPreviousData: false,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useIndexCommentsQuery = ({
  enabled,
  indexId,
}: {
  enabled?: boolean
  indexId: number
}) =>
  useAuthQuery({
    queryFn: getIndexComments,
    queryKey: ['index-comments', indexId],
    queryProps: { indexId },
    enabled,
  })

function useIndexMutationInvalidation() {
  const queryClient = useQueryClient()
  return (indexId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['index-detail'] })
    queryClient.invalidateQueries({ queryKey: ['index-related'] })
    queryClient.invalidateQueries({ queryKey: ['user-indexes'] })
    if (indexId) queryClient.invalidateQueries({ queryKey: ['index-comments', indexId] })
  }
}

export const useCreateIndexMutation = () => {
  const invalidate = useIndexMutationInvalidation()
  return useMutationMustAuth({
    mutationFn: createIndex,
    mutationKey: ['create-index'],
    onSuccess: () => invalidate(),
  })
}

export const useUpdateIndexMutation = () => {
  const invalidate = useIndexMutationInvalidation()
  return useMutationMustAuth({
    mutationFn: updateIndex,
    mutationKey: ['update-index'],
    onSuccess: (_, variables) => invalidate(variables.indexId),
  })
}

export const useDeleteIndexMutation = () => {
  const invalidate = useIndexMutationInvalidation()
  return useMutationMustAuth({
    mutationFn: deleteIndex,
    mutationKey: ['delete-index'],
    onSuccess: () => invalidate(),
  })
}

export const useCreateIndexRelatedMutation = () => {
  const invalidate = useIndexMutationInvalidation()
  return useMutationMustAuth({
    mutationFn: createIndexRelated,
    mutationKey: ['create-index-related'],
    onSuccess: (_, variables) => invalidate(variables.indexId),
  })
}

export const useUpdateIndexRelatedMutation = () => {
  const invalidate = useIndexMutationInvalidation()
  return useMutationMustAuth({
    mutationFn: updateIndexRelated,
    mutationKey: ['update-index-related'],
    onSuccess: (_, variables) => invalidate(variables.indexId),
  })
}

export const useDeleteIndexRelatedMutation = () => {
  const invalidate = useIndexMutationInvalidation()
  return useMutationMustAuth({
    mutationFn: deleteIndexRelated,
    mutationKey: ['delete-index-related'],
    onSuccess: (_, variables) => invalidate(variables.indexId),
  })
}

export const useResourceIndexesQuery = ({
  enabled = true,
  limit = 8,
  refetchPageLimit,
  resourceId,
  resourceType,
}: {
  enabled?: boolean
  limit?: number
  refetchPageLimit?: number
  resourceId: string | undefined
  resourceType: IndexResourceType
}) => {
  const subjectQuery = useSubjectIndexesQuery({
    enabled: enabled && resourceType === 'subject' && !!resourceId,
    id: resourceId ?? '',
    limit,
    refetchPageLimit,
  })
  const characterQuery = useCharacterIndexesQuery({
    enabled: enabled && resourceType === 'character' && !!resourceId,
    id: resourceId ?? '',
    limit,
    refetchPageLimit,
  })
  const personQuery = usePersonIndexesQuery({
    enabled: enabled && resourceType === 'person' && !!resourceId,
    id: resourceId,
    limit,
    refetchPageLimit,
  })

  if (resourceType === 'character') return characterQuery
  if (resourceType === 'person') return personQuery
  return subjectQuery
}
