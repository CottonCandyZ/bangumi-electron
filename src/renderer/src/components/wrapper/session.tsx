import { isAccessTokenValid, isWebLogin } from '@renderer/constants/api/session'
import { client } from '@renderer/lib/client'
import { useQuery } from '@tanstack/react-query'
import { PropsWithChildren, useEffect } from 'react'
import { token } from 'src/main/tipc'
import { create } from 'zustand'

interface SessionState {
  isLogin: boolean
  setLogin: (isLogin: boolean) => void
}

export const useSession = create<SessionState>((set) => ({
  isLogin: false,
  setLogin: (isLogin) => set(() => ({ isLogin })),
}))

interface AccessTokenState {
  accessToken: token | null
  setToken: (accessToken: token | null) => void
}

export const useAccessToken = create<AccessTokenState>((set) => ({
  accessToken: null,
  setToken: (accessToken) => set(() => ({ accessToken })),
}))

export default function Session({ children }: PropsWithChildren) {
  const { setToken } = useAccessToken()
  const { setLogin } = useSession()

  const { data: accessToken } = useQuery({
    queryKey: ['accessToken'],
    queryFn: async () => {
      return await client.getAccessToken()
    },
  })

  const { data: isLogin } = useQuery({
    queryKey: ['isLogin', accessToken],
    queryFn: async () => {
      if (!accessToken) return false
      return (await isWebLogin()) && (await isAccessTokenValid(accessToken))
    },
    enabled: accessToken !== undefined,
  })
  useEffect(() => {
    if (accessToken !== undefined) setToken(accessToken)
  }, [accessToken])
  useEffect(() => {
    if (isLogin !== undefined) setLogin(isLogin)
  }, [isLogin])

  return <>{children}</>
}
