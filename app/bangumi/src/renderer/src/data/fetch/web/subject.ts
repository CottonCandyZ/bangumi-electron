import { HTML_SUBJECTS, SUBJECTS, webFetch } from '@renderer/data/fetch/config/'
import { SubjectId } from '@renderer/data/types/bgm'
import type { SectionPath } from '@renderer/data/types/web'
import { AuthError } from '@renderer/lib/utils/error'

/**
 * 通用各分区首页 Fetch
 * @param sectionPath 各分区路径
 * @returns HTML
 */
export async function fetchSectionHome({ sectionPath }: { sectionPath: SectionPath }) {
  return await webFetch<string>(`/${sectionPath}`, {
    parseResponse: (text) => text,
  })
}

export async function fetchTrends({ sectionPath }: { sectionPath: SectionPath }) {
  return await webFetch<string>(SUBJECTS.TRENDS(sectionPath), {
    parseResponse: (text) => text,
  })
}

export async function fetchSubjectInfoById({ subjectId }: { subjectId: SubjectId }) {
  const text = await webFetch<string>(HTML_SUBJECTS.BY_ID(subjectId.toString()), {
    parseResponse: (text) => text,
    credentials: 'include',
  })
  if (text.includes('数据库中没有查询您所指定的条目')) {
    throw AuthError.notFound()
  }
  return text
}
