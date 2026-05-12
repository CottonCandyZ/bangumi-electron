import { Separator } from '@renderer/components/ui/separator'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { SearchContent } from '@renderer/modules/main/search/content'
import { lastSearchQueryStringAtom } from '@renderer/state/search'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function SearchContentWrapper() {
  const { getSearchParam } = useSearchParams()
  const searchParam = getSearchParam()
  const location = useLocation()
  const navigate = useNavigate()
  const [lastSearchQueryString, setLastSearchQueryString] = useAtom(lastSearchQueryStringAtom)

  useEffect(() => {
    if (searchParam && location.search) {
      setLastSearchQueryString(location.search)
      return
    }

    if (!searchParam && !location.search && lastSearchQueryString) {
      navigate({ pathname: location.pathname, search: lastSearchQueryString }, { replace: true })
    }
  }, [
    lastSearchQueryString,
    location.pathname,
    location.search,
    navigate,
    searchParam,
    setLastSearchQueryString,
  ])

  return (
    searchParam && (
      <div className="flex min-h-0 flex-1 flex-col">
        <Separator className="h-0 w-full border-b" />
        <SearchContent searchParam={searchParam} />
      </div>
    )
  )
}
