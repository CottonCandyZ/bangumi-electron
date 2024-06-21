import { API_HOST, AuthorizationHeader, USER, apiFetch } from '@renderer/constants/config'
import { AuthError } from '@renderer/lib/utils/error'

export interface userInfo {
  avatar: {
    large: string
    medium: string
    small: string
  }
  sign: string
  username: string
  nickname: string
  id: number
  user_group: number
}

export async function getUserInfo({ token }: { token: string }) {
  const { _data: data, status } = await apiFetch.raw(USER.ME, {
    baseURL: API_HOST,
    headers: {
      Authorization: AuthorizationHeader(token),
    },
  })
  if (status === 401) throw AuthError.expire()
  return data as userInfo
}
