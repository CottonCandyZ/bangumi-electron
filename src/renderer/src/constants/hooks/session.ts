import { isAccessTokenValid, isWebLogin, logout } from '@renderer/constants/fetch/user/session'
import { client } from '@renderer/lib/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['session'],
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['isLogin'], false)
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
    },
  })
}

export const useAccessTokenQuery = () => {
  return useQuery({
    queryKey: ['accessToken'],
    queryFn: async () => {
      return await client.getAccessToken()
    },
  })
}

export const useIsLoginQuery = () => {
  const { data: accessToken } = useAccessTokenQuery()
  return useQuery({
    queryKey: ['isLogin', accessToken],
    queryFn: async () => {
      if (!accessToken) return false
      return (await isWebLogin()) && (await isAccessTokenValid(accessToken))
    },
    placeholderData: !!window.localStorage.getItem('isLogin'),
    enabled: accessToken !== undefined,
  })
}