import { useAccessTokenQuery, useLogoutMutation } from '@renderer/data/hooks/session'
import { AuthError } from '@renderer/lib/utils/error'
import {
  GetNextPageParamFunction,
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { FetchError } from 'ofetch'

// 这里面有些类型判断还有些问题，等我精通 TS 了再回来思考吧
// 这里只处理 Auth Error 不处理其他的

type Fn<P, R> = (P: P) => Promise<R>
type OptionalProps<P> = keyof Omit<P, 'token'> extends never
  ? { queryProps?: Omit<P, 'token'> }
  : { queryProps: Omit<P, 'token'> }

/**
 * 为必须验证的 QueryHook 工厂
 *
 * 在验证失败时自动退出登录
 */
export const useQueryMustAuth = <P, R>({
  queryKey,
  queryFn,
  queryProps,
  enabled = true,
  ...props
}: {
  queryFn: P extends { token: string } ? Fn<P, R> : never
  enabled?: boolean
} & OptionalProps<P> &
  Omit<UseQueryOptions<R, Error, R, QueryKey>, 'queryFn'>) => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const { data: accessToken } = useAccessTokenQuery()
  const query = useQuery({
    queryKey: [...(queryKey || []), queryProps, accessToken?.access_token],
    queryFn: async () => {
      if (!accessToken?.access_token) throw AuthError.notAuth()
      let data: R | undefined
      try {
        data = await queryFn({ token: accessToken.access_token, ...queryProps } as P)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      return data as R
    },
    enabled: enabled && accessToken !== undefined,
    ...props,
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
  queryProps,
  enabled = true,
  select,
  needKeepPreviousData = true,
  ...props
}: {
  queryFn: P extends { token?: string } ? Fn<P, R> : never
  select?: (data: R) => S
  needKeepPreviousData?: boolean
} & OptionalProps<P> &
  Omit<UseQueryOptions<R, Error, R, QueryKey>, 'select' | 'queryFn'>) => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const { data: accessToken } = useAccessTokenQuery()
  const query = useQuery({
    queryKey: [...(queryKey || []), queryProps, accessToken?.access_token],
    queryFn: async () => {
      let data: R | undefined
      try {
        data = await queryFn({ token: accessToken?.access_token, ...queryProps } as P)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      return data as R
    },
    enabled: enabled && accessToken !== undefined,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    select,
    ...props,
  })
  if (query.isError && query.error instanceof AuthError) {
    if (query.error.code === 2) {
      queryClient.setQueryData(['accessToken'], null)
      logoutMutation.mutate()
    }
  }
  return query
}

type InfinityOptionalAuthProps<P> = keyof Omit<P, 'token' | 'offset' | 'limit'> extends never
  ? { queryProps?: Omit<P, 'token' | 'offset' | 'limit'> }
  : { queryProps: Omit<P, 'token' | 'offset' | 'limit'> }

export const useInfinityQueryOptionalAuth = <QP, QR, TPageParam>({
  queryKey,
  queryFn,
  queryProps,
  qFLimit,
  enabled = true,
  needKeepPreviousData = true,
  initialPageParam,
  getNextPageParam,
  ...props
}: {
  queryFn: QP extends { token?: string; offset: TPageParam; limit?: number } ? Fn<QP, QR> : never
  enabled?: boolean
  qFLimit?: number
  needKeepPreviousData?: boolean
  initialPageParam: TPageParam
  getNextPageParam: GetNextPageParamFunction<TPageParam, QR>
} & InfinityOptionalAuthProps<QP> &
  Omit<
    UseInfiniteQueryOptions<QR, Error, InfiniteData<QR, TPageParam>, QR, QueryKey, TPageParam>,
    'queryFn'
  >) => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const { data: accessToken } = useAccessTokenQuery()
  const query = useInfiniteQuery({
    queryKey: [...(queryKey || []), queryProps, accessToken?.access_token],
    queryFn: async ({ pageParam }) => {
      let data: QR | undefined
      try {
        data = await queryFn({
          token: accessToken?.access_token,
          limit: qFLimit,
          offset: pageParam as TPageParam,
          ...queryProps,
        } as QP)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      return data as QR
    },
    enabled: enabled && accessToken !== undefined,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    initialPageParam,
    getNextPageParam,
    ...props,
  })
  if (query.isError && query.error instanceof AuthError) {
    if (query.error.code === 2) {
      queryClient.setQueryData(['accessToken'], null)
      logoutMutation.mutate()
    }
  }
  return query
}

export const useMutationMustAuth = <P, R>({
  mutationKey,
  mutationFn,
  ...props
}: {
  mutationFn: P extends { token: string } ? Fn<P, R> : never
} & Omit<UseMutationOptions<R, Error, Omit<P, 'token'>>, 'mutationFn'>) => {
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const { data: accessToken } = useAccessTokenQuery()
  const mutate = useMutation({
    mutationKey,
    mutationFn: async (mutateProps: Omit<P, 'token'>) => {
      if (!accessToken) throw AuthError.notAuth()
      let data: R | undefined
      try {
        data = await mutationFn({ token: accessToken.access_token, ...mutateProps } as P)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      return data as R
    },
    ...props,
  })
  if (mutate.isError && mutate.error instanceof AuthError) {
    if (mutate.error.code === 2) {
      queryClient.setQueryData(['accessToken'], null)
      logoutMutation.mutate()
    }
  }
  return mutate
}
