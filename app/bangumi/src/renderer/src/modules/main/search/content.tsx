import { BigPagination } from '@renderer/components/big-pagination'
import { Button } from '@renderer/components/ui/button'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySearch } from '@renderer/data/hooks/api/search'
import { SearchParam } from '@renderer/data/types/search'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { PinSearchButton, SearchItemCard } from '@renderer/modules/main/search/item-card'
import { createSearchPanelId, createSearchPanelTitle } from '@renderer/modules/main/search/utils'
import { scrollViewportAtom, setScrollPositionAction } from '@renderer/state/scroll'
import { searchSummaryAtom } from '@renderer/state/search'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function SearchContent({ searchParam }: { searchParam: SearchParam }) {
  const { setOffset, offset } = useSearchParams()
  const contentRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const scrollViewport = useAtomValue(scrollViewportAtom)
  const updateScrollPosition = useSetAtom(setScrollPositionAction)
  const setSearchSummary = useSetAtom(searchSummaryAtom)
  const limit = 20

  const searchResultQuery = useQuerySearch({
    searchParam,
    limit,
    offset,
    keepPreviousData: false,
  })
  usePageScrollRestoreReady(!searchResultQuery.isPending)
  const searchResult = searchResultQuery.data
  const total = searchResult?.total ?? 0

  useEffect(() => {
    setSearchSummary({
      total,
      loading: searchResultQuery.isFetching,
      error: searchResultQuery.isError,
    })
  }, [searchResultQuery.isFetching, searchResultQuery.isError, setSearchSummary, total])

  const getContentScrollTop = useCallback(() => {
    const content = contentRef.current
    if (!content || !scrollViewport) return 0

    return Math.max(
      0,
      scrollViewport.scrollTop +
        content.getBoundingClientRect().top -
        scrollViewport.getBoundingClientRect().top,
    )
  }, [scrollViewport])

  return (
    <div ref={contentRef} className="flex min-h-0 flex-1 flex-col items-center justify-start">
      <div className="w-full flex-1">
        {searchResultQuery.isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="i-mingcute-warning-line text-muted-foreground text-3xl" aria-hidden />
            <div className="font-medium">搜索失败</div>
            <p className="text-muted-foreground text-sm">
              暂时无法获取搜索结果，请检查网络连接或稍后重试。
            </p>
            <Button
              variant="outline"
              disabled={searchResultQuery.isFetching}
              onClick={() => void searchResultQuery.refetch()}
            >
              {searchResultQuery.isFetching ? '正在重试…' : '重试'}
            </Button>
          </div>
        ) : searchResultQuery.isPending ? (
          <SkeletonList />
        ) : searchResult?.data.length === 0 ? (
          <div role="status" className="text-muted-foreground px-6 py-16 text-center text-sm">
            没有符合条件的结果，试试其他关键词或调整筛选条件。
          </div>
        ) : (
          searchResult?.data?.map((item) => <SearchItemCard searchItem={item} key={item.id} />)
        )}
      </div>
      {!searchResultQuery.isError && total > limit && (
        <div className="bg-background sticky bottom-0 w-full border-t py-3">
          <BigPagination
            total={Math.ceil(total / limit)}
            value={Math.floor(offset / limit) + 1}
            onValueChanged={(value) => {
              const nextOffset = (value - 1) * limit
              const nextSearchParams = new URLSearchParams(location.search)

              nextSearchParams.set('offset', String(nextOffset))
              setOffset(nextOffset)
              updateScrollPosition(
                getContentScrollTop(),
                `${location.pathname}?${nextSearchParams.toString()}`,
              )
            }}
          />
        </div>
      )}
    </div>
  )
}

export function SearchSummaryAction() {
  const { getSearchParam } = useSearchParams()
  const searchParam = getSearchParam()
  const location = useLocation()
  const searchSummary = useAtomValue(searchSummaryAtom)

  if (!searchParam) return null

  const panelTab = {
    id: createSearchPanelId(searchParam),
    type: searchParam.category === 'subjects' ? 'searchSubjects' : 'searchMonos',
    title: createSearchPanelTitle(searchParam),
    sourceTitle: `${getSearchCategoryLabel(searchParam.category)}搜索结果`,
    sourceTo: `${location.pathname}${location.search}`,
    searchParam,
  } satisfies MonoListPanelTab

  return (
    <div className="flex shrink-0 flex-row items-center gap-3">
      <div className="text-muted-foreground min-w-20 text-right text-sm">
        {searchSummary.loading
          ? '搜索中'
          : searchSummary.error
            ? '搜索失败'
            : searchSummary.total > 0
              ? `${searchSummary.total} 个结果`
              : '没有结果'}
      </div>
      <PinSearchButton tab={panelTab} />
    </div>
  )
}

function getSearchCategoryLabel(category: SearchParam['category']) {
  if (category === 'characters') return '角色'
  if (category === 'persons') return '人物'
  return '条目'
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="w-full border-b">
          <div className="mx-auto flex min-h-[136px] w-full max-w-4xl flex-row items-stretch gap-4 px-3 py-3">
            <Skeleton className="h-28 w-20 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
              <Skeleton className="h-5 w-52 max-w-[70%]" />
              <Skeleton className="h-3 w-36 max-w-[55%]" />
              <Skeleton className="h-3 w-72 max-w-[80%]" />
              <Skeleton className="h-8 w-full max-w-xl" />
              <div className="mt-auto flex flex-row gap-1.5">
                <Skeleton className="h-5 w-12 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            </div>
            <div className="flex w-64 shrink-0 flex-col justify-center gap-2 self-center max-lg:w-56 max-md:hidden">
              <Skeleton className="h-8 w-24 rounded-md" />
              <div className="flex flex-row gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
