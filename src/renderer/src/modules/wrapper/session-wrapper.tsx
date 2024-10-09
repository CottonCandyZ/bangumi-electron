import { useIsUnauthorized } from '@renderer/modules/wrapper/query'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { useAccessTokenQuery } from '@renderer/data/hooks/session'
import { APIUserInfo } from '@shared/types/user'
import { createContext, PropsWithChildren, useContext } from 'react'

export const SessionContext = createContext<{
  isLogin: undefined | boolean
  userInfo: undefined | APIUserInfo
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
  const userInfo = useQueryUserInfo({ enabled: !!isLogin }).data
  useIsUnauthorized()
  return (
    <SessionContext.Provider value={{ isLogin, userInfo, accessToken: token?.access_token }}>
      {children}
    </SessionContext.Provider>
  )
}
