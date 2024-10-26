import { USER, apiFetch } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { UerInfoAPI, UserInfo } from '@renderer/data/types/user'

/**
 * v0 接口拿 UserInfo
 */
export async function getUserInfo({ token }: { token: string }) {
  const data = await apiFetch<UerInfoAPI>(USER.ME, {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return { ...data, last_update_at: new Date() } satisfies UserInfo
}
