import { SUBJECTS, apiFetchWithOptionalAuth } from '@renderer/data/fetch/config/'
import { SubjectId } from '@renderer/data/types/bgm'
import { RelatedSubject, Subject, SubjectAPI } from '@renderer/data/types/subject'
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
