import { fetchSubjectInfoById } from '@renderer/data/fetch/web/subject'
import { parseDeleteCollectionHash } from '@renderer/data/transformer/web'
import { useQuery } from '@tanstack/react-query'
import { SubjectId } from '@renderer/data/types/bgm'
import { useSession } from '@renderer/data/hooks/session'

export const useWebDeleteCollectionHash = ({
  subjectId,
  enabled,
}: {
  subjectId: SubjectId
  enabled?: boolean
}) => {
  const userInfo = useSession()
  return useQuery({
    queryKey: ['SubjectHomePage', !!userInfo, subjectId],
    queryFn: async () => await fetchSubjectInfoById({ subjectId }),
    select: parseDeleteCollectionHash,
    enabled: enabled,
  })
}
