import { USER, apiFetch } from '@renderer/constants/fetch/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'
import { userInfo } from '@renderer/constants/types/user'

/**
 * v0 接口拿 UserInfo
 */
export async function getUserInfo({ token }: { token: string }) {
  const data = await apiFetch<userInfo>(USER.ME, {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return data
}
