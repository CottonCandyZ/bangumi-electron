import { SUBJECTS, apiFetch } from '@renderer/constants/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'

export async function getSubjectById({ id, token }: { id: string; token?: string }) {
  const { _data: info, status } = await apiFetch.raw(SUBJECTS.BY_ID(id), {
    headers: {
      ...getAuthHeader(token),
    },
  })
  if (!token && status === 404) return null
  return info
}
