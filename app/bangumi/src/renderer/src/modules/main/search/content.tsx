import { BigPagination } from '@renderer/components/big-pagination'
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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function SearchContent({ searchParam }: { searchParam: SearchParam }) {
  const [total, setTotal] = useState(0)
  const { setOffset, offset } = useSearchParams(() => {
    setTotal(0)
  })
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

  useEffect(() => {
    if (searchResult !== undefined) {
      setTotal(searchResult.total)
    }
  }, [searchResult, searchParam])

  useEffect(() => {
    setSearchSummary({ total, loading: searchResultQuery.isLoading })
  }, [searchResultQuery.isLoading, setSearchSummary, total])

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

  // if (searchResult === undefined)
  //   return (
  //     <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] gap-4 px-10">
  //       <SkeletonList />
  //     </div>
  //   )

  return (
    <div ref={contentRef} className="flex min-h-0 flex-1 flex-col items-center justify-start">
      <div className="w-full flex-1">
        {searchResultQuery.isLoading ? (
          <SkeletonList />
        ) : (
          searchResult?.data?.map((item) => <SearchItemCard searchItem={item} key={item.id} />)
        )}
      </div>
      <div className="bg-background sticky bottom-0 w-full border-t py-3">
        {total > 0 && (
          <BigPagination
            total={Math.ceil(total / limit)}
            value={Math.floor(offset / 20) + 1}
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
        )}
      </div>
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
        {searchSummary.total > 0
          ? `${searchSummary.total} 个结果`
          : searchSummary.loading
            ? '搜索中'
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
