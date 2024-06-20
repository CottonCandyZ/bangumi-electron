import { getUserInfo } from '@renderer/constants/fetch/user/info'
import { useQueryMustAuth } from '@renderer/constants/hooks'

export const useQueryUserInfo = () =>
  useQueryMustAuth({
    queryFn: getUserInfo,
    queryKey: ['userInfo'],
  })
