import {
  getPersonCommentsById,
  getPersonDetailById,
  getPersonIndexesById,
  getPersonRelatedCharactersById,
  getPersonRelatedSubjectsById,
  getSubjectPersonsById,
} from '@renderer/data/fetch/api/person'
import { useAuthQuery, useInfinityQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { PersonId, SubjectId } from '@renderer/data/types/bgm'
import { useQuery } from '@tanstack/react-query'

/**
 * 使用 id 获得 Subject 相关的人物信息
 * @deprecated 当前未使用，后续将删除
 */
export const useQuerySubjectPersons = ({
  id,
  enabled,
}: {
  id: SubjectId | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getSubjectPersonsById,
    queryKey: ['subject-persons'],
    queryProps: { id },
    enabled: enabled,
  })

/**
 * 使用 id 获得人物详情
 */
export const useQueryPersonsById = ({
  id,
  enabled,
}: {
  id: PersonId | undefined
  enabled?: boolean
}) =>
  useQuery({
    queryFn: () => getPersonDetailById({ id }),
    queryKey: ['person-detail', id],
    enabled: enabled,
  })

/**
 * 使用 id 获得人物参与作品
 */
export const useQueryPersonRelatedSubjects = ({
  id,
  enabled,
}: {
  id: PersonId | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getPersonRelatedSubjectsById,
    queryKey: ['person-related-subjects'],
    queryProps: { id },
    enabled,
  })

/**
 * 使用 id 获得人物出场角色
 */
export const useQueryPersonRelatedCharacters = ({
  id,
  enabled,
}: {
  id: PersonId | undefined
  enabled?: boolean
}) =>
  useAuthQuery({
    queryFn: getPersonRelatedCharactersById,
    queryKey: ['person-related-characters'],
    queryProps: { id },
    enabled,
  })

/**
 * 使用 id 获得人物吐槽箱
 */
export const useQueryPersonComments = ({
  id,
  enabled,
}: {
  id: PersonId | undefined
  enabled?: boolean
}) =>
  useQuery({
    queryFn: () => getPersonCommentsById({ id }),
    queryKey: ['person-comments', id],
    enabled,
  })

/**
 * 使用 id 获得人物关联目录。p1 indexes 支持 limit/offset 分页。
 */
export const usePersonIndexesQuery = ({
  enabled,
  id,
  limit = 8,
  refetchPageLimit,
}: {
  enabled?: boolean
  id: PersonId | undefined
  limit?: number
  refetchPageLimit?: number
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getPersonIndexesById,
    queryKey: ['person-indexes'],
    queryProps: { id },
    qFLimit: limit,
    refetchPageLimit,
    enabled,
    needKeepPreviousData: false,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })
