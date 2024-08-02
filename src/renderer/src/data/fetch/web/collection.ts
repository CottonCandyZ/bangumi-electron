import { HTML_COLLECTION, webFetch } from '@renderer/data/fetch/config'
import { SubjectId } from '@renderer/data/types/bgm'

export async function deleteSubjectCollectionById({
  subjectId,
  hash,
}: {
  subjectId: SubjectId
  hash: string
}) {
  const text = await webFetch<string>(HTML_COLLECTION.DELETE_SUBJECT_BY_ID(subjectId), {
    parseResponse: (text) => text,
    credentials: 'include',
    query: {
      gh: hash,
    },
  })
  return text
}
