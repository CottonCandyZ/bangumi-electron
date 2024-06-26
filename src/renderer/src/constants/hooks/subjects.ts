import { getSubjectById } from '@renderer/constants/fetch/api'
import { useQueryOptionalAuth } from '@renderer/constants/hooks'
import { TopList } from '@renderer/constants/types/web'

/**
 * 使用 id 获得 Subject 的基础信息，走 v0 接口
 */
export const useQuerySubjectInfo = ({
  id,
  enabled,
}: {
  id: TopList['SubjectId']
  enabled?: boolean
}) =>
  useQueryOptionalAuth({
    queryFn: getSubjectById,
    queryKey: ['userInfo'],
    props: { id },
    enabled: enabled,
  })
