import { getIndexById, getIndexRelated } from '@renderer/data/fetch/api/index'
import { useCharacterIndexesQuery } from '@renderer/data/hooks/api/character'
import { usePersonIndexesQuery } from '@renderer/data/hooks/api/person'
import { useSubjectIndexesQuery } from '@renderer/data/hooks/api/subject'
import { useAuthQuery, useInfinityQueryOptionalAuth } from '@renderer/data/hooks/factory'
import type { IndexRelatedCategory, IndexResourceType } from '@renderer/data/types/index'
import type { SubjectType } from '@renderer/data/types/subject'

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
