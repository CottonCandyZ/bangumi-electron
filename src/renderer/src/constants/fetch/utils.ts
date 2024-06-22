import { AuthorizationHeader } from '@renderer/constants/config'

export function getAuthHeader(token?: string) {
  if (!token) return undefined
  return { Authorization: AuthorizationHeader(token) }
}
