import { API_HOST, USER, apiFetch } from '@renderer/constants/config'

export interface unauthorized {
  title: string
  details: {
    path: string
    method: string
  }
  description: string
}

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

export async function getUserInfo(token: string) {
  const data = await apiFetch<userInfo | unauthorized>(USER.ME, {
    baseURL: API_HOST,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data
}
