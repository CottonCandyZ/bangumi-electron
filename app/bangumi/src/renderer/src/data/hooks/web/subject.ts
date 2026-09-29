import { fetchSubjectInfoById } from '@renderer/data/fetch/web/subject'
import { parseInfoBoxFromSubjectPage } from '@renderer/data/transformer/web'
import { useQuery } from '@tanstack/react-query'
import { SubjectId } from '@renderer/data/types/bgm'
import { useSession } from '@renderer/data/hooks/session'

export const useWebInfoBoxQuery = ({
  subjectId,
  enabled,
}: {
  subjectId: SubjectId
  enabled?: boolean
}) => {
  const userInfo = useSession()
  return useQuery({
    queryKey: ['SubjectInfoBoxV2', !!userInfo, subjectId],
    queryFn: async () => {
      const html = await fetchSubjectInfoById({ subjectId })
      return parseInfoBoxFromSubjectPage(html)
    },
    enabled: enabled,
  })
}
