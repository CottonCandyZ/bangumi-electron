import { SUBJECTS_WEB, webFetch } from '@renderer/data/fetch/config'
import { SubjectId } from '@renderer/data/types/bgm'
import type { sectionPath } from '@renderer/data/types/web'
import { AuthError } from '@renderer/lib/utils/error'

/**
 * 通用各分区首页 Fetch
 * @param sectionPath 各分区路径
 * @returns HTML
 */
export async function fetchSectionHome({ sectionPath }: { sectionPath: sectionPath }) {
  return await webFetch<string>(`/${sectionPath}`, {
    parseResponse: (text) => text,
  })
}

export async function fetchSubjectInfoById({ id }: { id: SubjectId }) {
  const text = await webFetch<string>(SUBJECTS_WEB.BY_ID(id.toString()), {
    parseResponse: (text) => text,
    credentials: 'include',
  })
  if (text.includes('数据库中没有查询您所指定的条目')) {
    throw AuthError.notFound()
  }
  return text
}
