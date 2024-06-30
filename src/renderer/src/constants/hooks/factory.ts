import { useAccessTokenQuery, useLogoutMutation } from '@renderer/constants/hooks/session'
import { AuthError } from '@renderer/lib/utils/error'
import { QueryOptions, useQuery } from '@tanstack/react-query'
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
    if (query.error.code === 2) logoutMutation.mutate()
  }
  return query
}

// 这里的异步考虑真的合理么？是不是应该让两个一起跑？但是这样的话 QueryKey 怎么给？
// R18 的会走 withoutAccessToken，非 R18 的一定会跑两遍
// 就分开好了，这样缓存也会非常轻松

/**
 * 为可选验证的 QueryHook 工厂
 *
 * 会先尝试不带 token 的版本，然后验证带 Token 的版本
 *
 * 如果发现登陆过期，会重置登录状态
 */
export const useQueryOptionalAuth = <P, R>({
  queryKey,
  queryFn,
  props,
  enabled,
}: {
  queryKey: QueryOptions['queryKey']
  queryFn: P extends { token?: string } ? Fn<P, R> : never
  enabled?: boolean
} & OptionalProps<P>) => {
  const logoutMutation = useLogoutMutation()
  const withoutAccessToken = useQuery({
    queryKey: [...(queryKey || []), props],
    queryFn: async () => {
      let data: R | undefined
      try {
        data = await queryFn({ ...props } as P)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          return null
        }
        throw error
      }
      return data as R
    },
    enabled: enabled,
  })
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
      }
      return data as R
    },
    enabled:
      (enabled === undefined ? true : enabled) &&
      accessToken !== undefined &&
      withoutAccessToken.data === null,
  })
  if (query.isError && query.error instanceof FetchError) {
    if (query.error.statusCode === 401) logoutMutation.mutate()
  }
  if (withoutAccessToken.data !== null) return withoutAccessToken
  return query
}
