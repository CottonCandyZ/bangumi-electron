import { SUBJECTS, apiFetch } from '@renderer/constants/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'
import { SubjectId } from '@renderer/constants/types'
import { Subject } from '@renderer/constants/types/subject'
import { FetchParamError } from '@renderer/lib/utils/error'
import { FetchError } from 'ofetch'

export async function getSubjectById({ id, token }: { id?: SubjectId; token?: string }) {
  if (!id) throw new FetchParamError('未获得 id')

  let info: Subject
  try {
    info = await apiFetch<Subject>(SUBJECTS.BY_ID(id.toString()), {
      headers: {
        ...getAuthHeader(token),
      },
    })
  } catch (e) {
    if (!token && e instanceof FetchError && e.statusCode === 404) {
      console.log(id)
      return null
    }
    throw e
  }
  return info
}
