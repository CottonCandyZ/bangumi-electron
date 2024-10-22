import { USER, apiFetch } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { UserInfo, UserInfoAPI } from '@renderer/data/types/user'

/**
 * v0 接口拿 UserInfo
 */
export async function getUserInfo({ token }: { token: string }) {
  const data = await apiFetch<UserInfoAPI>(USER.ME, {
    headers: {
      ...getAuthHeader(token),
    },
  })
  return {
    ...data,
    avatar: data.avatar.large.replace('https://lain.bgm.tv/', ''),
  } satisfies UserInfo
}
