import { useIsUnauthorized } from '@renderer/modules/wrapper/query'
import { useAccessTokenQuery } from '@renderer/data/hooks/session'
import { UserInfo } from '@renderer/data/types/user'
import { createContext, PropsWithChildren, useContext } from 'react'
import { useUserInfoQuery } from '@renderer/data/hooks/db/user'

export const SessionContext = createContext<{
  userInfo: undefined | UserInfo | null
  accessToken: string | undefined
}>({
  userInfo: undefined,
  accessToken: undefined,
})

export const useSession = () => {
  return useContext(SessionContext)
}

export function SessionWrapper({ children }: PropsWithChildren) {
  // token 是暂时提供的的，预计后续将会去除，只提供 userInfo
  // 现在 token 仅仅用来拼接 queryKey
  const token = useAccessTokenQuery().data
  const userInfo = useUserInfoQuery().data
  useIsUnauthorized()
  return (
    <SessionContext.Provider value={{ userInfo, accessToken: token?.access_token }}>
      {children}
    </SessionContext.Provider>
  )
}
