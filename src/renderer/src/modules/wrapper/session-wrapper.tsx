import { useIsUnauthorized } from '@renderer/modules/wrapper/query'
import { UserInfo } from '@renderer/data/types/user'
import { createContext, PropsWithChildren, useContext } from 'react'
import { useUserInfoQuery } from '@renderer/data/hooks/db/user'

export const SessionContext = createContext<{
  userInfo: undefined | UserInfo | null
}>({
  userInfo: undefined,
})

export const useSession = () => {
  return useContext(SessionContext)
}

export function SessionWrapper({ children }: PropsWithChildren) {
  const userInfo = useUserInfoQuery()
  useIsUnauthorized()
  return (
    <SessionContext.Provider value={{ userInfo: userInfo.isError ? null : userInfo.data }}>
      {children}
    </SessionContext.Provider>
  )
}
