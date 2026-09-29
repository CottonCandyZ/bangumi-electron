/**
 * @deprecated 首页和热门侧栏已改用 /p1/trending/subjects。
 * 暂留网页榜单实现供参考；不要从运行时代码导入，后续可整体删除。
 */
import { webFetch } from '@renderer/data/fetch/config'
import { queueWebTrends } from '@renderer/data/fetch/config/web-access'
import { parseTopListFromHTML as parseTrendsFromHTML } from '@renderer/data/transformer/web'
import {
  trimInfiniteQueryPagesIf,
  trimInfiniteQueryPages,
} from '@renderer/data/hooks/infinite-query'
import { useBangumiWebRefresh } from '@renderer/data/hooks/web-verification'
import type { SectionPath, TopList } from '@renderer/data/types/web'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

/**
 * 通用各分区首页 Fetch
 * @param sectionPath 各分区路径
 * @returns HTML
 */
export async function fetchSectionHome({ sectionPath }: { sectionPath: SectionPath }) {
  return await webFetch<string>(`/${sectionPath}`, {
    parseResponse: (text) => text,
  })
}

export async function fetchTrends({
  page,
  sectionPath,
}: {
  page?: number
  sectionPath: SectionPath
}) {
  return queueWebTrends(() =>
    webFetch<string>(
      `/${sectionPath}/browser/?sort=trends${page && page > 1 ? `&page=${page}` : ''}`,
      {
        parseResponse: (text) => text,
      },
    ),
  )
}

/**
 * 获得分区内 Top 关注，每个分区的右下角或者未登陆的首页内容
 * @param sectionPath 分区路径名
 * @returns 关注的 SubjectId 和 关注人数 数组
 */
export const useTopListQuery = (sectionPath: SectionPath) => {
  const query = useQuery({
    queryKey: ['SectionTrendsV2', sectionPath],
    queryFn: async () => {
      const html = await fetchTrends({ sectionPath })
      return parseTrendsFromHTML(html)
    },
  })
  const { refetch } = query
  const webRefresh = useBangumiWebRefresh({ onRefresh: refetch, sectionPath })
  return {
    ...query,
    refetch: webRefresh.refresh,
    requiresWebVerification: webRefresh.verificationRequired,
    isRefreshing: query.isFetching || webRefresh.verificationPending,
  }
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
  const webRefresh = useBangumiWebRefresh({ onRefresh: refetch, sectionPath })

  return {
    ...query,
    refetch: webRefresh.refresh,
    requiresWebVerification: webRefresh.verificationRequired,
    isRefreshing: query.isFetching || webRefresh.verificationPending,
  }
}
