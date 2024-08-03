import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { useAccessTokenQuery, useIsLoginQuery } from '@renderer/data/hooks/session'
import { UserInfo } from '@renderer/data/types/user'
import { createContext, PropsWithChildren, useContext } from 'react'

export const SessionContext = createContext<{
  isLogin: undefined | boolean
  userInfo: undefined | UserInfo
  accessToken: string | undefined
}>({
  isLogin: undefined,
  userInfo: undefined,
  accessToken: undefined,
})

export const useSession = () => {
  return useContext(SessionContext)
}

export default function SessionWrapper({ children }: PropsWithChildren) {
  const isLogin = useIsLoginQuery().data
  const userInfo = useQueryUserInfo({ enabled: !!isLogin }).data
  const accessToken = useAccessTokenQuery().data?.access_token

  return (
    <SessionContext.Provider value={{ isLogin, userInfo, accessToken }}>
      {children}
    </SessionContext.Provider>
  )
}
