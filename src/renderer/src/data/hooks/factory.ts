import { useAccessTokenQuery } from '@renderer/data/hooks/session'
import { AuthError } from '@renderer/lib/utils/error'
import { isRefreshingTokenAtom } from '@renderer/state/session'
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
import { useAtomValue } from 'jotai'
import { FetchError } from 'ofetch'

// 这里面有些类型判断还有些问题，等我精通 TS 了再回来思考吧
// 这里只处理 Auth Error 不处理其他的

type Fn<P, R> = (P: P) => Promise<R>
type OptionalProps<P> = keyof Omit<P, 'token'> extends never
  ? { queryProps?: Omit<P, 'token'> }
  : { queryProps: Omit<P, 'token'> }
type OptionalAPIQueryProps<P> = keyof Omit<P, 'token'> extends never
  ? { apiParams?: Omit<P, 'token'> }
  : { apiParams: Omit<P, 'token'> }
type OptionalDBQueryProps<P> = keyof Omit<P, 'user_id'> extends never
  ? { dbParams?: Omit<P, 'user_id'> }
  : { dbParams: Omit<P, 'user_id'> }

/**
 * 为必须验证的 QueryHook 工厂
 *
 * 在验证失败时自动退出登录
 */
export const useQueryMustAuth = <P, R>({
  queryKey = [],
  queryFn,
  queryProps,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  queryFn: P extends { token: string } ? Fn<P, R> : never
  enabled?: boolean
  needKeepPreviousData?: boolean
} & OptionalProps<P> &
  Omit<UseQueryOptions<R, Error, R, QueryKey>, 'queryFn'>) => {
  const { data: accessToken } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const query = useQuery({
    queryKey: [...queryKey, queryProps, accessToken?.access_token],
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
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    enabled: enabled && accessToken !== undefined && !isRefreshToken,
    ...props,
  })
  return query
}

/**
 * 同前必须验证 配合 db 会先读取后写入，写入后会 update 状态
 */
export const useDBQueryMustAuth = <TApiParams, TDbParams, TQueryFnReturn>({
  queryKey = [],
  apiQueryFn,
  dbQueryFn,
  updateDB,
  apiParams,
  dbParams,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: TApiParams extends { token: string } ? Fn<TApiParams, TQueryFnReturn> : never
  dbQueryFn: TDbParams extends { user_id: number }
    ? Fn<TDbParams, TQueryFnReturn | undefined>
    : never
  updateDB: Fn<TQueryFnReturn, void>
  enabled?: boolean
  needKeepPreviousData?: boolean
} & OptionalAPIQueryProps<TApiParams> &
  OptionalDBQueryProps<TDbParams> &
  Omit<
    UseQueryOptions<TQueryFnReturn | null, Error, TQueryFnReturn | null, QueryKey>,
    'queryFn'
  >) => {
  const { data: token } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const queryKeyWithToken = [...queryKey, apiParams, token?.access_token]
  const queryClient = useQueryClient()

  const unifiedQueryFn = async () => {
    if (!token) return null

    const dbData = await dbQueryFn({ user_id: token.user_id, ...dbParams } as TDbParams)

    const updateData = async () => {
      let apiData: TQueryFnReturn | undefined
      try {
        apiData = await apiQueryFn({ token: token.access_token, ...apiParams } as TApiParams)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      await updateDB(apiData)
      return apiData
    }

    if (dbData) {
      setTimeout(async () => {
        const apiData = await updateData()
        queryClient.setQueryData(queryKeyWithToken, apiData)
      }, 0)
      return dbData
    }
    const apiData = await updateData()
    return apiData
  }

  const query = useQuery({
    queryKey: queryKeyWithToken,
    queryFn: unifiedQueryFn,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    enabled: enabled && token !== undefined && !isRefreshToken,
    ...props,
  })
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
  queryKey = [],
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
  const { data: accessToken } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const query = useQuery({
    queryKey: [...queryKey, queryProps, accessToken?.access_token],
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
    enabled: enabled && accessToken !== undefined && !isRefreshToken,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    select,
    ...props,
  })
  return query
}

export const useDBQueryOptionalAuth = <TApiParams, TDbParams, TQueryFnReturn>({
  queryKey = [],
  apiQueryFn,
  dbQueryFn,
  updateDB,
  apiParams,
  dbParams,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: TApiParams extends { token?: string } ? Fn<TApiParams, TQueryFnReturn> : never
  dbQueryFn: Fn<TDbParams, TQueryFnReturn | undefined>
  dbParams: TDbParams
  updateDB: Fn<TQueryFnReturn, void>
  enabled?: boolean
  needKeepPreviousData?: boolean
} & OptionalAPIQueryProps<TApiParams> &
  Omit<
    UseQueryOptions<TQueryFnReturn | null, Error, TQueryFnReturn | null, QueryKey>,
    'queryFn'
  >) => {
  const { data: token } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const queryKeyWithToken = [...queryKey, apiParams, token?.access_token]
  const queryClient = useQueryClient()

  const unifiedQueryFn = async () => {
    const dbData = await dbQueryFn({ ...dbParams } as TDbParams)

    const updateData = async () => {
      let apiData: TQueryFnReturn | undefined
      try {
        apiData = await apiQueryFn({ token: token?.access_token, ...apiParams } as TApiParams)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
      await updateDB(apiData)
      return apiData
    }

    if (dbData) {
      setTimeout(async () => {
        const apiData = await updateData()
        queryClient.setQueryData(queryKeyWithToken, apiData)
      }, 0)
      return dbData
    }
    const apiData = await updateData()
    return apiData
  }

  const query = useQuery({
    queryKey: queryKeyWithToken,
    queryFn: unifiedQueryFn,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    enabled: enabled && token !== undefined && !isRefreshToken,
    ...props,
  })
  return query
}

type InfinityOptionalAuthProps<P> = keyof Omit<P, 'token' | 'offset' | 'limit'> extends never
  ? { queryProps?: Omit<P, 'token' | 'offset' | 'limit'> }
  : { queryProps: Omit<P, 'token' | 'offset' | 'limit'> }

export const useInfinityQueryOptionalAuth = <QP, QR, TPageParam>({
  queryKey = [],
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
  const { data: accessToken } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const query = useInfiniteQuery({
    queryKey: [...queryKey, queryProps, accessToken?.access_token],
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
    enabled: enabled && accessToken !== undefined && !isRefreshToken,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    initialPageParam,
    getNextPageParam,
    ...props,
  })
  return query
}

export const useMutationMustAuth = <P, R>({
  mutationKey,
  mutationFn,
  ...props
}: {
  mutationFn: P extends { token: string } ? Fn<P, R> : never
} & Omit<UseMutationOptions<R, Error, Omit<P, 'token'>>, 'mutationFn'>) => {
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
  return mutate
}
