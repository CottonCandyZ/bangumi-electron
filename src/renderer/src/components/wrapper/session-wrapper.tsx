import { refreshToken } from '@renderer/data/fetch/web/login'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
import { useAccessTokenQuery, useIsLoginQuery } from '@renderer/data/hooks/session'
import { UserInfo } from '@renderer/data/types/user'
import { LoginError } from '@renderer/lib/utils/error'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FetchError } from 'ofetch'
import { createContext, PropsWithChildren, useContext, useEffect } from 'react'
import { toast } from 'sonner'

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

let init = false

export default function SessionWrapper({ children }: PropsWithChildren) {
  const isLogin = useIsLoginQuery().data
  const userInfo = useQueryUserInfo({ enabled: !!isLogin }).data
  const token = useAccessTokenQuery().data
  const refreshTokenMutation = useMutation({
    mutationFn: refreshToken,
    onError(error) {
      if (error instanceof LoginError) {
        toast.error(error.message)
      } else if (error instanceof FetchError) {
        toast.error('网络错误')
      } else {
        toast.error('未知错误')
      }
    },
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    // 没登陆
    if (token === null) {
      init = true
      return
    }

    if (!init && token !== undefined) {
      refreshTokenMutation.mutate(token.refresh_token)
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
      init = true
    }
  }, [token])

  return (
    <SessionContext.Provider value={{ isLogin, userInfo, accessToken: token?.access_token }}>
      {children}
    </SessionContext.Provider>
  )
}
