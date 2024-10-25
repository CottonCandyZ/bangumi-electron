import { USER, apiFetch } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { UserInfo } from '@renderer/data/types/user'

/**
 * v0 接口拿 UserInfo
 */
export async function getUserInfo({ token }: { token: string }) {
  const data = await apiFetch<UserInfo>(USER.ME, {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return data
}
