import { getUserInfo } from '@renderer/constants/fetch/user/info'
import { useQueryMustAuth } from '@renderer/constants/hooks'

/**
 * 获得用户信息，使用 AccessToken 鉴权，走 v0 接口
 * @returns 用户信息
 */
export const useQueryUserInfo = () =>
  useQueryMustAuth({
    queryFn: getUserInfo,
    queryKey: ['userInfo'],
  })
