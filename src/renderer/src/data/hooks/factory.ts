import { DB_CONFIG } from '@renderer/config'
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
type OptionalAPIQueriesProps<P> = keyof Omit<P, 'token' | 'id'> extends never
  ? { apiParams?: Omit<P, 'token' | 'id'> }
  : { apiParams: Omit<P, 'token' | 'id'> }
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
export const useDBQueryMustAuth = <
  TApiParams,
  TDbParams,
  TQueryFnReturn extends { last_update_at: Date },
>({
  queryKey = [],
  apiQueryFn,
  dbQueryFn,
  updateDB,
  apiParams,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: TApiParams extends { token: string } ? Fn<TApiParams, TQueryFnReturn> : never
  dbQueryFn: TDbParams extends { user_id: number }
    ? Fn<TDbParams, TQueryFnReturn | undefined>
    : never
  updateDB: Fn<TQueryFnReturn, void>
  dbStaleTime?: number
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
  const dbQueryKey = [...queryKey, dbParams, token?.access_token]
  const queryClient = useQueryClient()

  const updateDBMutate = useMutation({
    mutationFn: updateDB,
  })

  const update = async () => {
    if (!token) return null
    let apiData: TQueryFnReturn | undefined
    try {
      apiData = await apiQueryFn({ token: token?.access_token, ...apiParams } as TApiParams)
    } catch (error) {
      if (error instanceof FetchError && error.statusCode === 401) {
        throw AuthError.expire()
      }
      throw error
    }
    updateDBMutate.mutate(apiData)
    return apiData
  }

  const fetchMutate = useMutation({
    mutationFn: update,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  const fetchFromDB = async () => {
    if (!token) return null
    const data = await dbQueryFn({ user_id: token.user_id, ...dbParams } as TDbParams)
    if (data === undefined) {
      return await fetchMutate.mutateAsync()
    }
    const last_update_at = data.last_update_at.getTime()
    if (new Date().getTime() - last_update_at > dbStaleTime) {
      fetchMutate.mutate()
    } else {
      setTimeout(() => {
        queryClient.setQueryData<TQueryFnReturn>(dbQueryKey, (oldData) => oldData, {
          updatedAt: last_update_at,
        })
      }, 10)
    }
    return data
  }

  const dbQuery = useQuery({
    queryKey: dbQueryKey,
    queryFn: fetchFromDB,
    enabled: enabled && token !== undefined && !isRefreshToken,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    staleTime: dbStaleTime,
    persister: undefined,
    ...props,
  })

  return dbQuery
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

export const useQueriesOptionalAuth = <P, R extends { id: number }>({
  queryKey = [],
  queryFn,
  queryIds,
  apiParams,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  queryFn: P extends { token?: string } ? Fn<P, R> : never
  queryIds: number[]
  needKeepPreviousData?: boolean
} & OptionalAPIQueriesProps<P> &
  Omit<UseQueryOptions<(R | null)[], Error, (R | null)[], QueryKey>, 'select' | 'queryFn'>) => {
  const { data: token } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [...queryKey, queryIds, apiParams, token?.access_token],
    queryFn: async () => {
      const res = await Promise.allSettled(
        queryIds.map((id) => queryFn({ token: token?.access_token, id, ...apiParams } as P)),
      )

      return res.map((item) => {
        if (item.status === 'rejected') {
          const e = item.reason
          if (e instanceof FetchError && e.statusCode === 401) throw AuthError.expire()
          return null
        }
        queryClient.setQueryData<R>(
          [...queryKey, { id: item.value.id }, token?.access_token],
          item.value,
        )
        return item.value
      })
    },
    enabled: enabled && token !== undefined && !isRefreshToken,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    ...props,
  })
  return query
}

export const useDBQueryOptionalAuth = <
  TApiParams,
  TDbParams,
  TQueryFnReturn extends { last_update_at: Date },
>({
  queryKey = [],
  apiQueryFn,
  dbQueryFn,
  updateDB,
  apiParams,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: TApiParams extends { token?: string } ? Fn<TApiParams, TQueryFnReturn> : never
  dbQueryFn: Fn<TDbParams, TQueryFnReturn | undefined>
  dbParams: TDbParams
  updateDB: Fn<TQueryFnReturn, void>
  dbStaleTime?: number
  enabled?: boolean
  needKeepPreviousData?: boolean
} & OptionalAPIQueryProps<TApiParams> &
  Omit<UseQueryOptions<TQueryFnReturn, Error, TQueryFnReturn, QueryKey>, 'queryFn'>) => {
  const { data: token } = useAccessTokenQuery()
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const dbQueryKey = [...queryKey, dbParams, token?.access_token]
  const queryClient = useQueryClient()

  const updateDBMutate = useMutation({
    mutationFn: updateDB,
  })

  const update = async () => {
    let apiData: TQueryFnReturn | undefined
    try {
      apiData = await apiQueryFn({ token: token?.access_token, ...apiParams } as TApiParams)
    } catch (error) {
      if (error instanceof FetchError && error.statusCode === 401) {
        throw AuthError.expire()
      }
      throw error
    }
    updateDBMutate.mutate(apiData)
    return apiData
  }

  const mutate = useMutation({
    mutationFn: update,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  const fetchFromDB = async () => {
    const data = await dbQueryFn({ ...dbParams } as TDbParams)
    if (data === undefined) {
      return await mutate.mutateAsync()
    }
    const last_update_at = data.last_update_at.getTime()
    if (new Date().getTime() - last_update_at > dbStaleTime) {
      mutate.mutate()
    } else {
      setTimeout(() => {
        queryClient.setQueryData<TQueryFnReturn>(dbQueryKey, (oldData) => oldData, {
          updatedAt: last_update_at,
        })
      }, 10)
    }
    return data
  }

  return useQuery({
    queryKey: dbQueryKey,
    queryFn: fetchFromDB,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    enabled: enabled && token !== undefined && !isRefreshToken,
    persister: undefined,
    staleTime: dbStaleTime,
    ...props,
  })
}

export const useDBQueriesOptionalAuth = <
  TApiParams,
  TDbParams extends { ids?: number[] },
  TQueryFnReturn extends { last_update_at: Date; id: number },
>({
  queryKey = [],
  apiQueryFn,
  dbQueryFn,
  updateDB,
  apiParams,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: TApiParams extends { token?: string } ? Fn<TApiParams, TQueryFnReturn> : never
  dbQueryFn: Fn<TDbParams, TQueryFnReturn[]>
  dbParams: TDbParams
  updateDB: Fn<TQueryFnReturn[], void>
  dbStaleTime?: number
  enabled?: boolean
  needKeepPreviousData?: boolean
} & OptionalAPIQueriesProps<TApiParams> &
  Omit<
    UseQueryOptions<(TQueryFnReturn | null)[], Error, (TQueryFnReturn | null)[], QueryKey>,
    'queryFn'
  >) => {
  const { data: token } = useAccessTokenQuery()
  const accessToken = token?.access_token
  const isRefreshToken = useAtomValue(isRefreshingTokenAtom)
  const dbQueryKey = [...queryKey, dbParams, accessToken]
  const queryClient = useQueryClient()

  const updateDBMutate = useMutation({
    mutationFn: updateDB,
  })

  const fetchData = async ({
    allIds,
    fetchArray,
    dataMap,
  }: {
    allIds: number[]
    fetchArray: number[]
    dataMap: Map<number, TQueryFnReturn>
  }) => {
    const res = await Promise.allSettled(
      fetchArray.map((id) => apiQueryFn({ token: accessToken, id, ...apiParams } as TApiParams)),
    )
    const errors = res.filter((v) => v.status === 'rejected').map((v) => v.reason)
    for (const e of errors) {
      if (e instanceof FetchError && e.statusCode === 401) {
        throw AuthError.expire()
      }
      if (e instanceof FetchError && e.status === 404) {
        continue
      }
      throw e
    }
    const apiData = res.filter((v) => v.status === 'fulfilled').map((v) => v.value)

    updateDBMutate.mutate(apiData)

    for (const data of apiData) {
      dataMap.set(data.id, data)
    }

    //FIXME: NSFW 条目没有特殊处理，只是返回 null
    const currentTime = new Date().getTime()
    let minimalTimestamp = currentTime
    const data = allIds.map((id) => {
      const data = dataMap.get(id) ?? null
      if (data) {
        queryClient.setQueryData<TQueryFnReturn>([...queryKey, { id }, accessToken], data, {
          updatedAt: data.last_update_at.getTime(),
        })
        minimalTimestamp = Math.min(minimalTimestamp, data.last_update_at.getTime())
      }
      return data
    })

    return { data, minimalTimestamp }
  }

  const fetchDataMutation = useMutation({
    mutationFn: fetchData,
    onSuccess: ({ data, minimalTimestamp }) => {
      queryClient.setQueryData<(TQueryFnReturn | null)[]>(dbQueryKey, data, {
        updatedAt: minimalTimestamp,
      })
    },
    throwOnError: (e) => !(e instanceof AuthError),
  })

  const getData = (dbData: TQueryFnReturn[]) => {
    if (dbParams.ids === undefined) throw new FetchError('[Params error]: no ids')
    const allIds = dbParams.ids
    const dataMap = new Map(dbData.map((item) => [item.id, item]))
    const currentTime = new Date().getTime()
    let minimalTimestamp = currentTime
    const fetchArray = allIds.filter((id) => {
      const data = dataMap.get(id)
      if (data === undefined) return true
      else if (currentTime - data.last_update_at.getTime() > dbStaleTime) return true
      else {
        minimalTimestamp = Math.min(data.last_update_at.getTime(), minimalTimestamp)
        return false
      }
    })
    const dbOrderedData = allIds.map((id) => {
      const data = dataMap.get(id) ?? null
      if (data)
        queryClient.setQueryData<TQueryFnReturn>([...queryKey, { id }, accessToken], data, {
          updatedAt: data.last_update_at.getTime(),
        })
      return data
    })
    if (fetchArray.length === 0) {
      setTimeout(() => {
        queryClient.setQueryData<(TQueryFnReturn | null)[]>(dbQueryKey, (oldData) => oldData, {
          updatedAt: minimalTimestamp,
        })
      }, 10)
      return dbOrderedData
    }

    fetchDataMutation.mutate({ allIds, dataMap, fetchArray })

    return dbOrderedData
  }

  const dbQuery = useQuery({
    queryKey: dbQueryKey,
    queryFn: async () => {
      const data = await dbQueryFn({ ...dbParams } as TDbParams)
      return getData(data)
    },
    networkMode: 'offlineFirst',
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    enabled: enabled && token !== undefined && !isRefreshToken,
    persister: undefined,
    staleTime: dbStaleTime,
    throwOnError: (e, query) => query.state.data === undefined && !(e instanceof AuthError),
    ...props,
  })

  return dbQuery
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
