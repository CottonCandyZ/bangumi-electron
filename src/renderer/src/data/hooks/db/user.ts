import { readLoginInfo } from '@renderer/data/fetch/db/user'
import { useQuery } from '@tanstack/react-query'

export function useLoginInfoQuery() {
  return useQuery({ queryKey: ['login-info-list'], queryFn: readLoginInfo, staleTime: 0 })
}
