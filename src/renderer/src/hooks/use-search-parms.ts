import { SearchParam } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import { useCallback } from 'react'
import { useSearchParams as useRouterSearchParams } from 'react-router-dom'

export function useSearchParams(onChange?: () => void) {
  const [searchParams, setSearchParams] = useRouterSearchParams()

  const keyword = searchParams.get('keyword') || ''
  const sort = (searchParams.get('sort') || 'match') as SearchParam['sort']
  const typeFilters = searchParams.getAll('type').map((type) => Number(type) as SubjectType)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const setKeyword = useCallback(
    (newKeyword: string) => {
      onChange?.()
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        if (newKeyword) {
          newParams.set('keyword', newKeyword)
        } else {
          newParams.delete('keyword')
        }
        // Reset offset when keyword changes
        newParams.set('offset', '0')
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const setSort = useCallback(
    (newSort: SearchParam['sort']) => {
      onChange?.()
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        if (newSort !== undefined) {
          newParams.set('sort', newSort)
        } else {
          newParams.delete('sort')
        }
        // Reset offset when sort changes
        newParams.set('offset', '0')
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const setTypeFilters = useCallback(
    (types: SubjectType[]) => {
      onChange?.()
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('type')
        types.forEach((type) => {
          newParams.append('type', String(type))
        })
        // Reset offset when type filters change
        newParams.set('offset', '0')
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const setOffset = useCallback(
    (newOffset: number) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.set('offset', String(newOffset))
        return newParams
      })
    },
    [setSearchParams],
  )

  const getSearchParam = useCallback((): SearchParam | null => {
    if (!keyword) return null

    return {
      keyword,
      filter: { type: typeFilters },
      sort,
    }
  }, [keyword, typeFilters, sort])

  return {
    keyword,
    sort,
    typeFilters,
    offset,
    setKeyword,
    setSort,
    setTypeFilters,
    setOffset,
    getSearchParam,
  }
}
