import {
  NEXT_SUBJECTS,
  SUBJECTS,
  apiFetchWithOptionalAuth,
  nextFetch,
} from '@renderer/data/fetch/config/'
import { SubjectId } from '@renderer/data/types/bgm'
import { SubjectInterestComments } from '@renderer/data/types/comment'
import type { SlimIndex } from '@renderer/data/types/index'
import {
  P1Page,
  RelatedSubject,
  Subject,
  SubjectAPI,
  SubjectRecommendation,
} from '@renderer/data/types/subject'
import { FetchParamError } from '@renderer/lib/utils/error'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 从 v0 获得 subject 的基础信息
 */
export async function getSubjectById({ id }: { id: number }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetchWithOptionalAuth<SubjectAPI>(SUBJECTS.BY_ID(id.toString()))

  return {
    ...info,
    date: info.date ? dayjs.tz(info.date, 'Asia/Shanghai').toDate() : null,
    ratingCount: info.rating.count,
    last_update_at: new Date(),
  } satisfies Subject as Subject
}

/**
 * 从 v0 获得 subject 相关的 subjects
 */
export async function getRelatedSubjects({ id }: { id: SubjectId }) {
  return await apiFetchWithOptionalAuth<RelatedSubject[]>(
    SUBJECTS.RELATED_SUBJECT_BY_ID(id.toString()),
  )
}

/**
 * 从 private p1 API 获得条目吐槽箱
 */
export async function getSubjectCommentsById({
  id,
  limit,
  offset,
}: {
  id: SubjectId
  limit?: number
  offset: number
  cacheKeyLimit?: number
}) {
  return await nextFetch<SubjectInterestComments>(NEXT_SUBJECTS.COMMENTS_BY_ID(id.toString()), {
    query: {
      limit,
      offset,
    },
  })
}

/** 从 private p1 API 获得条目推荐 */
export async function getSubjectRecommendationsById({
  id,
  limit,
  offset,
}: {
  id: SubjectId
  limit?: number
  offset: number
}) {
  return await nextFetch<P1Page<SubjectRecommendation>>(NEXT_SUBJECTS.RECS_BY_ID(id.toString()), {
    query: {
      limit,
      offset,
    },
  })
}

/** 从 private p1 API 获得条目关联目录 */
export async function getSubjectIndexesById({
  id,
  limit,
  offset,
}: {
  id: SubjectId
  limit?: number
  offset: number
}) {
  return await nextFetch<P1Page<SlimIndex>>(NEXT_SUBJECTS.INDEXES_BY_ID(id.toString()), {
    query: {
      limit,
      offset,
    },
  })
}
