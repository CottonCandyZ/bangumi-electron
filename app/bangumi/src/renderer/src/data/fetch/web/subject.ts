import { HTML_SUBJECTS, webFetch } from '@renderer/data/fetch/config/'
import { SubjectId } from '@renderer/data/types/bgm'
import { AuthError } from '@renderer/lib/utils/error'

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
