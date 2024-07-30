import { getUserInfo } from '@renderer/data/fetch/api/user'
import { useQueryMustAuth } from '@renderer/data/hooks/factory'

/**
 * 获得用户信息，使用 AccessToken 鉴权，走 v0 接口
 * @returns 用户信息
 */
export const useQueryUserInfo = ({ enabled }: { enabled?: boolean } = {}) =>
  useQueryMustAuth({
    queryFn: getUserInfo,
    queryKey: ['userInfo'],
    enabled,
  })
