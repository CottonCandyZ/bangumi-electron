import { SUBJECTS, apiFetch } from '@renderer/constants/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'

export async function getSubjectById({ id, token }: { id: string; token?: string }) {
  const info = await apiFetch(SUBJECTS.BY_ID(id), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}
