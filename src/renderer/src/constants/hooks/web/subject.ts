import { fetchSectionHome } from '@renderer/constants/fetch/web/subject'
import { parseTopListFromHTML } from '@renderer/constants/transformer/web'
import { useQuery } from '@tanstack/react-query'
import type { sectionPath } from '@renderer/constants/types/web'

// 分离 parse 和 fetch，方便缓存整个页面的内容

/**
 * 获得分区内 Top 关注，每个分区的右下角或者未登陆的首页内容
 * @param sectionPath 分区路径名
 * @returns 关注的 SubjectId 和 关注人数 数组
 */
export const useTopListQuery = (sectionPath: sectionPath) => {
  return useQuery({
    queryKey: ['SectionHome', sectionPath],
    queryFn: async () => await fetchSectionHome({ sectionPath }),
    select: parseTopListFromHTML,
  })
}
