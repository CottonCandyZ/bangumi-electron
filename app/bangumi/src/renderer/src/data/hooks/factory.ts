import {
  DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  trimInfiniteQueryPagesIf,
  trimInfiniteQueryPages,
} from '@renderer/data/hooks/infinite-query'
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
import { useCallback, useMemo } from 'react'

type Fn<P, R> = (P: P) => Promise<R>

type OptionalQueryProps<P> = keyof P extends never ? { queryProps?: P } : { queryProps: P }

type OptionalAPIQueriesProps<P> = keyof Omit<P, 'id'> extends never
  ? { apiParams?: Omit<P, 'id'> }
  : { apiParams: Omit<P, 'id'> }

type InfinityOptionalAuthProps<P> = keyof Omit<P, 'offset' | 'limit'> extends never
  ? { queryProps?: Omit<P, 'offset' | 'limit'> }
  : { queryProps: Omit<P, 'offset' | 'limit'> }

type QueryKeyWithRoot = [unknown, ...unknown[]]

const createQueryKeyWithUserId = (
  queryKey: QueryKeyWithRoot,
  userId: QueryKey[number],
  ...tail: QueryKey
): QueryKey => [...queryKey, userId, ...tail]

export const useAuthQueries = <TApiParams, TQueryFnReturn extends { id: number }>({
  queryKey,
  queryFn,
  queryIds,
  apiParams,
  enabled = true,
  needKeepPreviousData = true,
  ...props
}: {
  queryKey: QueryKeyWithRoot
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
    queryKey: createQueryKeyWithUserId(queryKey, userId, queryIds, apiParams),
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
        queryClient.setQueryData(
          createQueryKeyWithUserId(queryKey, userId, { id: item.value.id }),
          item.value,
        )
        return item.value
      })
    },
    enabled,
    placeholderData: needKeepPreviousData ? keepPreviousData : undefined,
    ...props,
  })
}

export { useLocalResource as useDBQuery, useLocalResources as useDBQueries } from './local-resource'

export const useAuthQuery = <TApiParams, TQueryFnReturn, TData = TQueryFnReturn>({
  queryKey,
  queryFn,
  queryProps,
  needKeepPreviousData,
  ...props
}: {
  queryKey: QueryKeyWithRoot
  needKeepPreviousData?: boolean
  queryFn: Fn<TApiParams, TQueryFnReturn>
} & OptionalQueryProps<TApiParams> &
  Omit<UseQueryOptions<TQueryFnReturn, Error, TData, QueryKey>, 'queryFn'>) => {
  const userId = useAtomValue(userIdAtom)
  return useQuery({
    queryKey: createQueryKeyWithUserId(queryKey, userId, queryProps),
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

export const useInfinityQueryOptionalAuth = <QP, QR, TPageParam>({
  queryKey,
  queryFn,
  queryProps,
  qFLimit,
  enabled = true,
  needKeepPreviousData = true,
  refetchPageLimit = DEFAULT_INFINITE_REFETCH_PAGE_LIMIT,
  initialPageParam,
  getNextPageParam,
  ...props
}: {
  queryKey: QueryKeyWithRoot
  queryFn: QP extends { offset: TPageParam; limit?: number } ? Fn<QP, QR> : never
  enabled?: boolean
  qFLimit?: number
  needKeepPreviousData?: boolean
  initialPageParam: TPageParam
  getNextPageParam: GetNextPageParamFunction<TPageParam, QR>
  refetchPageLimit?: number
} & InfinityOptionalAuthProps<QP> &
  Omit<
    UseInfiniteQueryOptions<QR, Error, InfiniteData<QR, TPageParam>, QueryKey, TPageParam>,
    'queryFn'
  >) => {
  const userId = useAtomValue(userIdAtom)
  const queryClient = useQueryClient()
  const queryKeyWithUserId = useMemo(
    () => createQueryKeyWithUserId(queryKey, userId, queryProps, qFLimit),
    [qFLimit, queryKey, queryProps, userId],
  )
  const { refetchOnMount, refetchOnReconnect, refetchOnWindowFocus, ...queryOptions } = props
  const refetchOnMountValue = refetchOnMount as boolean | 'always' | undefined
  const refetchOnReconnectValue = refetchOnReconnect as boolean | 'always' | undefined
  const refetchOnWindowFocusValue = refetchOnWindowFocus as boolean | 'always' | undefined
  const query = useInfiniteQuery({
    queryKey: [...queryKey, userId, queryProps, qFLimit],
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
    ...queryOptions,
    refetchOnMount: (query) => {
      const shouldRefetch = refetchOnMountValue ?? true
      const willRefetch = shouldRefetch === 'always' || (shouldRefetch !== false && query.isStale())
      trimInfiniteQueryPagesIf<QR, TPageParam>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey: queryKeyWithUserId,
        shouldTrim: willRefetch,
      })
      return shouldRefetch
    },
    refetchOnReconnect: (query) => {
      const shouldRefetch = refetchOnReconnectValue ?? true
      const willRefetch = shouldRefetch === 'always' || (shouldRefetch !== false && query.isStale())
      trimInfiniteQueryPagesIf<QR, TPageParam>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey: queryKeyWithUserId,
        shouldTrim: willRefetch,
      })
      return shouldRefetch
    },
    refetchOnWindowFocus: (query) => {
      const shouldRefetch = refetchOnWindowFocusValue ?? true
      const willRefetch = shouldRefetch === 'always' || (shouldRefetch !== false && query.isStale())
      trimInfiniteQueryPagesIf<QR, TPageParam>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey: queryKeyWithUserId,
        shouldTrim: willRefetch,
      })
      return shouldRefetch
    },
  })
  const { refetch: originalRefetch } = query
  const refetch = useCallback(
    (...args: Parameters<typeof originalRefetch>) => {
      trimInfiniteQueryPages<QR, TPageParam>({
        pageLimit: refetchPageLimit,
        queryClient,
        queryKey: queryKeyWithUserId,
      })

      return originalRefetch(...args)
    },
    [originalRefetch, queryClient, queryKeyWithUserId, refetchPageLimit],
  )

  return {
    ...query,
    refetch,
  }
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

export const useQueryKeyWithUserId = (queryKey: QueryKeyWithRoot, ...tail: QueryKey) => {
  const userId = useAtomValue(userIdAtom)
  return createQueryKeyWithUserId(queryKey, userId, ...tail)
}
