import { DB_CONFIG } from '@renderer/config'
import { AuthError } from '@renderer/lib/utils/error'
import { userIdAtom } from '@renderer/state/session'
import type {
  GetNextPageParamFunction,
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { FetchError } from 'ofetch'
import { useDeferredValue } from 'react'

type Fn<P, R> = (P: P) => Promise<R>

type OptionalQueryProps<P> = keyof P extends never ? { queryProps?: P } : { queryProps: P }

type OptionalAPIQueriesProps<P> = keyof Omit<P, 'id'> extends never
  ? { apiParams?: Omit<P, 'id'> }
  : { apiParams: Omit<P, 'id'> }

type InfinityOptionalAuthProps<P> = keyof Omit<P, 'offset' | 'limit'> extends never
  ? { queryProps?: Omit<P, 'offset' | 'limit'> }
  : { queryProps: Omit<P, 'offset' | 'limit'> }

export const useAuthQueries = <TApiParams, TQueryFnReturn extends { id: number }>({
  queryKey = [],
  queryFn,
  queryIds,
  apiParams,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  queryFn: TApiParams extends { id: number } ? Fn<TApiParams, TQueryFnReturn> : never
  queryIds: number[]
  needKeepPreviousData?: boolean
} & OptionalAPIQueriesProps<TApiParams> &
  Omit<
    UseQueryOptions<(TQueryFnReturn | null)[], Error, (TQueryFnReturn | null)[], QueryKey>,
    'select' | 'queryFn'
  >) => {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [...queryKey, queryIds, apiParams, userId],
    queryFn: async () => {
      const res = await Promise.allSettled(
        queryIds.map((id) => queryFn({ id, ...apiParams } as TApiParams)),
      )

      return res.map((item) => {
        if (item.status === 'rejected') {
          const e = item.reason
          if (e instanceof FetchError && e.statusCode === 401) throw AuthError.expire()
          return null
        }
        queryClient.setQueryData([...queryKey, { id: item.value.id }, userId], item.value)
        return item.value
      })
    },
    enabled,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    ...props,
  })
}

export const useDBQuery = <TApiParams, TDbParams, TQueryFnReturn extends { last_update_at: Date }>({
  queryKey = [],
  apiQueryFn,
  apiParams,
  dbQueryFn,
  updateDB,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: Fn<TApiParams, TQueryFnReturn>
  dbQueryFn: Fn<TDbParams, TQueryFnReturn | undefined>
  apiParams: TApiParams
  dbParams: TDbParams
  updateDB: Fn<TQueryFnReturn, void>
  dbStaleTime?: number
  enabled?: boolean
  needKeepPreviousData?: boolean
} & Omit<UseQueryOptions<TQueryFnReturn, Error, TQueryFnReturn, QueryKey>, 'queryFn'>) => {
  const userId = useAtomValue(userIdAtom)
  const dbQueryKey = [...queryKey, dbParams, userId]
  const queryClient = useQueryClient()

  const updateDBMutate = useMutation({
    mutationFn: updateDB,
  })

  const update = async () => {
    const apiData = await apiQueryFn(apiParams)
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
    const lastUpdateAt = data.last_update_at.getTime()
    if (new Date().getTime() - lastUpdateAt > dbStaleTime) {
      mutate.mutate()
    }
    return data
  }

  return useQuery({
    queryKey: dbQueryKey,
    queryFn: fetchFromDB,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    enabled,
    persister: undefined,
    staleTime: dbStaleTime,
    ...props,
  })
}

export const useAuthQuery = <TApiParams, TQueryFnReturn, TData = TQueryFnReturn>({
  queryKey = [],
  queryFn,
  queryProps,
  needKeepPreviousData,
  ...props
}: {
  needKeepPreviousData?: boolean
  queryFn: Fn<TApiParams, TQueryFnReturn>
} & OptionalQueryProps<TApiParams> &
  Omit<UseQueryOptions<TQueryFnReturn, Error, TData, QueryKey>, 'queryFn'>) => {
  const userId = useAtomValue(userIdAtom)
  return useQuery({
    queryKey: [...queryKey, queryProps, userId],
    queryFn: async () => {
      try {
        return await queryFn(queryProps as TApiParams)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
    },
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    ...props,
  })
}

export const useDBQueries = <
  TApiParams extends { id: number },
  TDbParams extends { ids?: number[] },
  TQueryFnReturn extends { last_update_at: Date; id: number },
>({
  queryKey = [],
  apiQueryFn,
  apiParams,
  dbQueryFn,
  updateDB,
  dbParams,
  dbStaleTime = DB_CONFIG.DEFAULT_STALE_TIME,
  needKeepPreviousData = true,
  ...props
}: {
  apiQueryFn: Fn<TApiParams, TQueryFnReturn>
  apiParams?: Omit<TApiParams, 'id'>
  dbQueryFn: Fn<TDbParams, TQueryFnReturn[]>
  dbParams: TDbParams
  updateDB: Fn<TQueryFnReturn[], void>
  dbStaleTime?: number
  needKeepPreviousData?: boolean
} & Omit<
  UseQueryOptions<(TQueryFnReturn | null)[], Error, (TQueryFnReturn | null)[], QueryKey>,
  'queryFn'
>) => {
  const userId = useAtomValue(userIdAtom)
  const dbQueryKey = [...queryKey, dbParams, userId]
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
      fetchArray.map((id) => apiQueryFn({ id, ...(apiParams || {}) } as TApiParams)),
    )
    const errors = res.filter((v) => v.status === 'rejected').map((v) => v.reason)
    for (const e of errors) {
      if (e instanceof FetchError && e.statusCode === 404) continue
      throw e
    }
    const apiData = res.filter((v) => v.status === 'fulfilled').map((v) => v.value)

    updateDBMutate.mutate(apiData)

    for (const data of apiData) {
      dataMap.set(data.id, data)
    }

    const currentTime = new Date().getTime()
    let minimalTimestamp = currentTime
    const data = allIds.map((id) => {
      const item = dataMap.get(id) ?? null
      if (item) {
        queryClient.setQueryData<TQueryFnReturn>([...queryKey, { id }, userId], item, {
          updatedAt: item.last_update_at.getTime(),
        })
        minimalTimestamp = Math.min(minimalTimestamp, item.last_update_at.getTime())
      }
      return item
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
    const fetchArray = allIds.filter((id) => {
      const data = dataMap.get(id)
      if (data === undefined) return true
      return currentTime - data.last_update_at.getTime() > dbStaleTime
    })
    const dbOrderedData = allIds.map((id) => {
      const data = dataMap.get(id) ?? null
      if (data) queryClient.setQueryData<TQueryFnReturn>([...queryKey, { id }, userId], data)
      return data
    })

    if (fetchArray.length === 0) {
      return dbOrderedData
    }

    fetchDataMutation.mutate({ allIds, dataMap, fetchArray })
    return dbOrderedData
  }

  return useQuery({
    queryKey: dbQueryKey,
    queryFn: async () => {
      const data = await dbQueryFn({ ...dbParams } as TDbParams)
      return getData(data)
    },
    networkMode: 'offlineFirst',
    persister: undefined,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    staleTime: dbStaleTime,
    ...props,
  })
}

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
  queryFn: QP extends { offset: TPageParam; limit?: number } ? Fn<QP, QR> : never
  enabled?: boolean
  qFLimit?: number
  needKeepPreviousData?: boolean
  initialPageParam: TPageParam
  getNextPageParam: GetNextPageParamFunction<TPageParam, QR>
} & InfinityOptionalAuthProps<QP> &
  Omit<
    UseInfiniteQueryOptions<QR, Error, InfiniteData<QR, TPageParam>, QueryKey, TPageParam>,
    'queryFn'
  >) => {
  const userId = useAtomValue(userIdAtom)
  return useInfiniteQuery({
    queryKey: [...queryKey, queryProps, userId],
    queryFn: async ({ pageParam }) => {
      try {
        return await queryFn({
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
    },
    enabled,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    initialPageParam,
    getNextPageParam,
    ...props,
  })
}

export const useMutationMustAuth = <P, R>({
  mutationKey,
  mutationFn,
  ...props
}: {
  mutationFn: Fn<P, R>
} & Omit<UseMutationOptions<R, Error, P>, 'mutationFn'>) => {
  const userId = useAtomValue(userIdAtom)
  return useMutation({
    mutationKey,
    mutationFn: async (mutateProps: P) => {
      if (!userId) throw AuthError.notAuth()
      try {
        return await mutationFn(mutateProps)
      } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
          throw AuthError.expire()
        }
        throw error
      }
    },
    ...props,
  })
}

export const useQueryKeyWithUserId = (queryKey: QueryKey) => {
  const userId = useDeferredValue(useAtomValue(userIdAtom))
  return [...queryKey, userId]
}
