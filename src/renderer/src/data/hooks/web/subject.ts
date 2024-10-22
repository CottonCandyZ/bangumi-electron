import { fetchSubjectInfoById, fetchTrends } from '@renderer/data/fetch/web/subject'
import {
  parseInfoBoxFromSubjectPage,
  parseTopListFromHTML as parseTrendsFromHTML,
} from '@renderer/data/transformer/web'
import { useQuery } from '@tanstack/react-query'
import type { SectionPath } from '@renderer/data/types/web'
import { SubjectId } from '@renderer/data/types/bgm'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'

// 分离 parse 和 fetch，方便缓存整个页面的内容

/**
 * 获得分区内 Top 关注，每个分区的右下角或者未登陆的首页内容
 * @param sectionPath 分区路径名
 * @returns 关注的 SubjectId 和 关注人数 数组
 */
export const useTopListQuery = (sectionPath: SectionPath) => {
  return useQuery({
    queryKey: ['SectionTrends', sectionPath],
    queryFn: async () => await fetchTrends({ sectionPath }),
    select: parseTrendsFromHTML,
  })
}

export const useWebInfoBoxQuery = ({
  subjectId,
  enabled,
}: {
  subjectId: SubjectId
  enabled?: boolean
}) => {
  const { userInfo } = useSession()
  return useQuery({
    queryKey: ['SubjectHomePage', !!userInfo, subjectId],
    queryFn: async () => await fetchSubjectInfoById({ subjectId }),
    select: parseInfoBoxFromSubjectPage,
    enabled: enabled,
  })
}
