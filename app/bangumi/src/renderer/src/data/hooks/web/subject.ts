import { fetchSubjectInfoById, fetchTrends } from '@renderer/data/fetch/web/subject'
import {
  parseInfoBoxFromSubjectPage,
  parseTopListFromHTML as parseTrendsFromHTML,
} from '@renderer/data/transformer/web'
import {
  trimInfiniteQueryPagesIf,
  trimInfiniteQueryPages,
} from '@renderer/data/hooks/infinite-query'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SectionPath } from '@renderer/data/types/web'
import type { TopList } from '@renderer/data/types/web'
import { SubjectId } from '@renderer/data/types/bgm'
import { useSession } from '@renderer/data/hooks/session'
import { useCallback, useMemo } from 'react'

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

export const useTrendsInfiniteQuery = (sectionPath: SectionPath) => {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['SectionTrendsInfiniteV2', sectionPath] as const, [sectionPath])
  const query = useInfiniteQuery({
    queryKey: ['SectionTrendsInfiniteV2', sectionPath],
    queryFn: async ({ pageParam }) => {
      const html = await fetchTrends({ sectionPath, page: pageParam })
      return parseTrendsFromHTML(html)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length === 0) return undefined

      const previousIds = new Set(
        pages
          .slice(0, -1)
          .flatMap((page) => page)
          .map((item) => item.SubjectId)
          .filter(Boolean),
      )
      const hasNewItem = lastPage.some((item) => item.SubjectId && !previousIds.has(item.SubjectId))
      return hasNewItem ? pages.length + 1 : undefined
    },
    refetchOnMount: (query) => {
      trimInfiniteQueryPagesIf<TopList[], number>({
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    refetchOnReconnect: (query) => {
      trimInfiniteQueryPagesIf<TopList[], number>({
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
    refetchOnWindowFocus: (query) => {
      trimInfiniteQueryPagesIf<TopList[], number>({
        queryClient,
        queryKey,
        shouldTrim: query.isStale(),
      })
      return true
    },
  })
  const { refetch: originalRefetch } = query
  const refetch = useCallback(
    (...args: Parameters<typeof originalRefetch>) => {
      trimInfiniteQueryPages<TopList[], number>({
        queryClient,
        queryKey,
      })

      return originalRefetch(...args)
    },
    [originalRefetch, queryClient, queryKey],
  )

  return {
    ...query,
    refetch,
  }
}

export const useWebInfoBoxQuery = ({
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
    select: parseInfoBoxFromSubjectPage,
    enabled: enabled,
  })
}
