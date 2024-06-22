import { getSubjectById } from '@renderer/constants/fetch/api'
import { useQueryOptionalAuth } from '@renderer/constants/hooks'

export const useQueryUserInfo = (id: string) =>
  useQueryOptionalAuth({
    queryFn: getSubjectById,
    queryKey: ['userInfo'],
    props: { id },
  })
