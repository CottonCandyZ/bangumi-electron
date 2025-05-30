import { getUserInfo } from '@renderer/data/fetch/api/user'
import { insertUserInfo, readLoginInfo, readUserInfo } from '@renderer/data/fetch/db/user'
import { useDBQueryMustAuth } from '@renderer/data/hooks/factory'
import { useQuery } from '@tanstack/react-query'

export function useLocalLoginInfoQuery() {
  return useQuery({
    queryKey: ['login-info-list'],
    queryFn: readLoginInfo,
    staleTime: 0,
    persister: undefined,
  })
}

export function useUserInfoQuery() {
  return useDBQueryMustAuth({
    queryKey: ['userInfo'],
    apiQueryFn: getUserInfo,
    dbQueryFn: readUserInfo,
    updateDB: insertUserInfo,
  })
}
