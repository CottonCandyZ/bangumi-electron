import { API_HOST, USER, apiFetch } from '@renderer/constants/config'
import { getAuthHeader } from '@renderer/constants/fetch/utils'

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
  const data = await apiFetch<userInfo>(USER.ME, {
    baseURL: API_HOST,
    headers: {
      ...getAuthHeader(token),
    },
  })
  return data
}
