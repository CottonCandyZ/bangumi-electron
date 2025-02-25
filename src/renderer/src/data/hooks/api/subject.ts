import { getRelatedSubjects, getSubjectById } from '@renderer/data/fetch/api/subject'
import { useQueriesOptionalAuth, useQueryOptionalAuth } from '@renderer/data/hooks/factory'
import { sortCharacterByRelation } from '@renderer/data/transformer/api'
import { SubjectId } from '@renderer/data/types/bgm'

/**
 * 使用 id 获得 Subject 的基础信息，走 v0 接口
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

/**
 * 使用 id 获得 Subject 相关的 subjects
 */
export const useQueryRelatedSubjects = ({
  id,
  enabled,
  needKeepPreviousData,
}: {
  id: SubjectId | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getRelatedSubjects,
    queryKey: ['subject-related'],
    queryProps: { id },
    select: sortCharacterByRelation(),
    enabled,
    needKeepPreviousData,
  })
