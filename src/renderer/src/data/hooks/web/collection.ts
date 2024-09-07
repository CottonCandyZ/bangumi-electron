import { fetchSubjectInfoById } from '@renderer/data/fetch/web/subject'
import { parseDeleteCollectionHash } from '@renderer/data/transformer/web'
import { useQuery } from '@tanstack/react-query'
import { SubjectId } from '@renderer/data/types/bgm'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'

export const useWebDeleteCollectionHash = ({
  subjectId,
  enabled,
}: {
  subjectId: SubjectId
  enabled?: boolean
}) => {
  const { isLogin } = useSession()
  return useQuery({
    queryKey: ['SubjectHomePage', isLogin, subjectId],
    queryFn: async () => await fetchSubjectInfoById({ subjectId }),
    select: parseDeleteCollectionHash,
    enabled: enabled,
  })
}
