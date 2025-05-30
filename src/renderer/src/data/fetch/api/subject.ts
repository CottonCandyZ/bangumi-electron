import { SUBJECTS, apiFetch, apiFetchWithAuth } from '@renderer/data/fetch/config/'
import { getAuthHeader } from '@renderer/data/fetch/utils'
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
export async function getSubjectById({ id, token }: { id?: number; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')

  const info = await apiFetch<SubjectAPI>(SUBJECTS.BY_ID(id.toString()), {
    headers: {
      ...getAuthHeader(token),
    },
  })

  return {
    ...info,
    date: info.date ? dayjs.tz(info.date, 'Asia/Shanghai').toDate() : null,
    ratingCount: info.rating.count,
    last_update_at: new Date(),
  } satisfies Subject as Subject
}

export async function getSubjectByIdWithToken({ id }: { id: number }) {
  const info = await apiFetchWithAuth<SubjectAPI>(SUBJECTS.BY_ID(id.toString()))
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
  return await apiFetchWithAuth<RelatedSubject[]>(SUBJECTS.RELATED_SUBJECT_BY_ID(id.toString()))
}
