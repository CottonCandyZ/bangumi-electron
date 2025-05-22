import { getRelatedSubjects, getSubjectById } from '@renderer/data/fetch/api/subject'
import {
  useAuthSuspenseQuery,
  useQueriesOptionalAuth,
  useQueryOptionalAuth,
} from '@renderer/data/hooks/factory'
import { sortCharacterByRelation } from '@renderer/data/transformer/api'
import { SubjectId } from '@renderer/data/types/bgm'

/**
 * 使用 id 获得 Subject 的基础信息，走 v0 接口
 * 暂时先用 DB 版本的替代了，故这里用不到
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
  useQueryOptionalAuth({
    queryFn: getSubjectById,
    queryKey: ['subject-info'],
    queryProps: { id: Number(id) },
    enabled: enabled,
    needKeepPreviousData,
  })

/** 暂时先用 DB 版本的替代了，故这里用不到 */
export const useSubjectsInfoAPIQuery = ({
  subjectIds: ids,
  enabled,
  needKeepPreviousData,
}: {
  subjectIds: SubjectId[] | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useQueriesOptionalAuth({
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
  useAuthSuspenseQuery({
    queryFn: getRelatedSubjects,
    queryKey: ['subject-related'],
    queryProps: { id },
    select: sortCharacterByRelation(),
    needKeepPreviousData,
  })
