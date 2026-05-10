import {
  getRelatedSubjects,
  getSubjectById,
  getSubjectCommentsById,
} from '@renderer/data/fetch/api/subject'
import {
  useAuthQuery,
  useAuthQueries,
  useInfinityQueryOptionalAuth,
} from '@renderer/data/hooks/factory'
import { sortCharacterByRelation } from '@renderer/data/transformer/api'
import { SubjectId } from '@renderer/data/types/bgm'

/**
 * 使用 id 获得 Subject 的基础信息，走 v0 接口
 * 暂时先用 DB 版本的替代了，故这里用不到
 * @deprecated 已被 DB 查询链路替代，后续将删除
 */
export const useSubjectInfoAPIQuery = ({
  subjectId: id,
  enabled,
  needKeepPreviousData,
}: {
  subjectId: SubjectId | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useAuthQuery({
    queryFn: getSubjectById,
    queryKey: ['subject-info'],
    queryProps: { id: Number(id) },
    enabled: enabled,
    needKeepPreviousData,
  })

/**
 * 暂时先用 DB 版本的替代了，故这里用不到
 * @deprecated 已被 DB 查询链路替代，后续将删除
 */
export const useSubjectsInfoAPIQuery = ({
  subjectIds: ids,
  enabled,
  needKeepPreviousData,
}: {
  subjectIds: SubjectId[] | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useAuthQueries({
    queryFn: getSubjectById,
    queryIds: ids?.map((id) => Number(id)) ?? [],
    queryKey: ['subject-info'],
    enabled: enabled,
    needKeepPreviousData,
  })

export const useRelatedSubjectsQuery = ({
  id,
  needKeepPreviousData,
}: {
  id: SubjectId
  needKeepPreviousData?: boolean
}) =>
  useAuthQuery({
    queryFn: getRelatedSubjects,
    queryKey: ['subject-related'],
    queryProps: { id },
    select: sortCharacterByRelation(),
    needKeepPreviousData,
  })

/**
 * 使用 id 获得条目吐槽箱。p1 subject comments 支持 limit/offset 分页。
 */
export const useSubjectCommentsQuery = ({
  id,
  enabled,
  limit = 20,
}: {
  id: SubjectId
  enabled?: boolean
  limit?: number
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getSubjectCommentsById,
    queryKey: ['subject-comments'],
    queryProps: { id, cacheKeyLimit: limit },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return nextOffset < lastPage.total ? nextOffset : undefined
    },
  })
