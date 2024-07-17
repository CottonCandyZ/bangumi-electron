import { useAccessTokenQuery, useLogoutMutation } from '@renderer/data/hooks/session'
import { AuthError } from '@renderer/lib/utils/error'
import { QueryOptions, keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { FetchError } from 'ofetch'

// 这里面有些类型判断还有些问题，等我精通 TS 了再回来思考吧
// 这里只处理 Auth Error 不处理其他的

type Fn<P, R> = (P: P) => Promise<R>
type OptionalProps<P> = keyof Omit<P, 'token'> extends never
  ? { props?: Omit<P, 'token'> }
  : { props: Omit<P, 'token'> }

/**
 * 为必须验证的 QueryHook 工厂
 *
 * 在验证失败时自动退出登录
 */
export const useQueryMustAuth = <P, R>({
  queryKey,
  queryFn,
  props,
}: {
  queryKey: QueryOptions['queryKey']
  queryFn: P extends { token: string } ? Fn<P, R> : never
} & OptionalProps<P>) => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const { data: accessToken } = useAccessTokenQuery()
  const query = useQuery({
    queryKey: [accessToken, ...(queryKey || []), props],
    queryFn: async () => {
      if (!accessToken) throw AuthError.notAuth()
      let data: R | undefined
      try {
        data = await queryFn({ token: accessToken.access_token, ...props } as P)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      return data as R
    },
    enabled: accessToken !== undefined,
  })
  if (query.isError && query.error instanceof AuthError) {
    if (query.error.code === 2) {
      queryClient.setQueryData(['accessToken'], null)
      logoutMutation.mutate()
    }
  }
  return query
}

/**
 * 为可选验证的 QueryHook 工厂
 *
 * 无论有没有 auth token，直接尝试并返回结果
 *
 * 如果发现登陆过期，会重置登录状态
 */
export const useQueryOptionalAuth = <P, R, S = R>({
  queryKey,
  queryFn,
  props,
  enabled,
  select,
  needKeepPreviousData = true,
}: {
  queryKey: QueryOptions['queryKey']
  queryFn: P extends { token?: string } ? Fn<P, R> : never
  enabled?: boolean
  select?: (data: R) => S
  needKeepPreviousData?: boolean
} & OptionalProps<P>) => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const { data: accessToken } = useAccessTokenQuery()
  const query = useQuery({
    queryKey: [accessToken, ...(queryKey || []), props],
    queryFn: async () => {
      let data: R | undefined
      try {
        data = await queryFn({ token: accessToken?.access_token, ...props } as P)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      return data as R
    },
    enabled: (enabled === undefined ? true : enabled) && accessToken !== undefined,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    select: select,
  })
  if (query.isError && query.error instanceof AuthError) {
    if (query.error.code === 2) {
      queryClient.setQueryData(['accessToken'], null)
      logoutMutation.mutate()
    }
  }
  return query
}
