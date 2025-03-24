import { AuthorizationHeader } from '@renderer/data/fetch/config/'

/**
 * 获得 AuthHeader 的工具类
 *
 * 使用时直接 ...getAuthHeader(token) 即可
 */
export function getAuthHeader(token?: string) {
  if (!token) return undefined
  return { Authorization: AuthorizationHeader(token) }
}
