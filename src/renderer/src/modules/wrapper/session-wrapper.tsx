import { useIsUnauthorized } from '@renderer/modules/wrapper/query'
import { useAccessTokenQuery } from '@renderer/data/hooks/session'
import { UserInfo } from '@renderer/data/types/user'
import { createContext, PropsWithChildren, useContext } from 'react'
import { useUserInfoQuery } from '@renderer/data/hooks/db/user'

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

export function SessionWrapper({ children }: PropsWithChildren) {
  const token = useAccessTokenQuery().data
  const isLogin = token === undefined ? undefined : !!token
  const userInfo = useUserInfoQuery({ enabled: !!isLogin }).data
  useIsUnauthorized()
  return (
    <SessionContext.Provider value={{ isLogin, userInfo, accessToken: token?.access_token }}>
      {children}
    </SessionContext.Provider>
  )
}
