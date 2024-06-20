import { useAccessTokenQuery, useLogoutMutation } from '@renderer/constants/hooks/session'
import { AuthError } from '@renderer/lib/utils/error'
import { QueryOptions, UseQueryResult, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useQueryMustAuth = <QueryFnReturnType, QueryFnParmType extends { token: string }>({
  queryKey,
  queryFn,
  props,
}: object extends Omit<QueryFnParmType, 'token'>
  ? {
      queryKey: QueryOptions['queryKey']
      queryFn: (P: QueryFnParmType) => QueryFnReturnType
      props?: Omit<QueryFnParmType, 'token'>
    }
  : {
      queryKey: QueryOptions['queryKey']
      queryFn: (P: QueryFnParmType) => QueryFnReturnType
      props: Omit<QueryFnParmType, 'token'>
    }) => {
  const logoutMutation = useLogoutMutation()
  const { data: accessToken } = useAccessTokenQuery()
  const query = useQuery({
    queryKey: [accessToken, ...(queryKey || []), props],
    queryFn: async () => {
      if (!accessToken) throw AuthError.notAuth()
      return await queryFn({ token: accessToken.access_token, ...props } as QueryFnParmType)
    },
    enabled: accessToken !== undefined,
  }) as UseQueryResult<Awaited<QueryFnReturnType>, Error>
  if (query.isError && query.error instanceof AuthError) {
    if (query.error.code === 2) logoutMutation.mutate()
    toast.error(query.error.message)
  }
  return query
}
