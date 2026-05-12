import { SearchParam } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import { useCallback, useMemo } from 'react'
import { useSearchParams as useRouterSearchParams } from 'react-router-dom'

type RangeFilterKey = 'airDate' | 'rating' | 'rank'
type ArrayFilterKey = 'tag' | 'metaTag'

const ARRAY_PARAM_KEY: Record<ArrayFilterKey, string> = {
  tag: 'tag',
  metaTag: 'meta_tag',
}

const RANGE_PARAM_KEY: Record<RangeFilterKey, string> = {
  airDate: 'air_date',
  rating: 'rating',
  rank: 'rank',
}

export function useSearchParams(onChange?: () => void) {
  const [searchParams, setSearchParams] = useRouterSearchParams()

  const keyword = searchParams.get('keyword') || ''
  const sort = (searchParams.get('sort') || 'match') as SearchParam['sort']
  const typeFilters = useMemo(
    () => searchParams.getAll('type').map((type) => Number(type) as SubjectType),
    [searchParams],
  )
  const tagFilters = useMemo(
    () => searchParams.getAll(ARRAY_PARAM_KEY.tag).filter(Boolean),
    [searchParams],
  )
  const metaTagFilters = useMemo(
    () => searchParams.getAll(ARRAY_PARAM_KEY.metaTag).filter(Boolean),
    [searchParams],
  )
  const airDateFilters = useMemo(
    () => searchParams.getAll(RANGE_PARAM_KEY.airDate).filter(Boolean),
    [searchParams],
  )
  const ratingFilters = useMemo(
    () => searchParams.getAll(RANGE_PARAM_KEY.rating).filter(Boolean),
    [searchParams],
  )
  const rankFilters = useMemo(
    () => searchParams.getAll(RANGE_PARAM_KEY.rank).filter(Boolean),
    [searchParams],
  )
  const nsfw = searchParams.get('nsfw') === 'true'
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const resetOffset = (params: URLSearchParams) => {
    params.set('offset', '0')
  }

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
        resetOffset(newParams)
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
        resetOffset(newParams)
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
        resetOffset(newParams)
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const setArrayFilter = useCallback(
    (key: ArrayFilterKey, values: string[]) => {
      onChange?.()
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        const paramKey = ARRAY_PARAM_KEY[key]
        newParams.delete(paramKey)
        values
          .map((value) => value.trim())
          .filter(Boolean)
          .forEach((value) => newParams.append(paramKey, value))
        resetOffset(newParams)
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const setRangeFilter = useCallback(
    (key: RangeFilterKey, values: string[]) => {
      onChange?.()
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        const paramKey = RANGE_PARAM_KEY[key]
        newParams.delete(paramKey)
        values.filter(Boolean).forEach((value) => newParams.append(paramKey, value))
        resetOffset(newParams)
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const setNsfw = useCallback(
    (value: boolean) => {
      onChange?.()
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        if (value) newParams.set('nsfw', 'true')
        else newParams.delete('nsfw')
        resetOffset(newParams)
        return newParams
      })
    },
    [setSearchParams, onChange],
  )

  const clearFilters = useCallback(() => {
    onChange?.()
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('type')
      newParams.delete(ARRAY_PARAM_KEY.tag)
      newParams.delete(ARRAY_PARAM_KEY.metaTag)
      newParams.delete(RANGE_PARAM_KEY.airDate)
      newParams.delete(RANGE_PARAM_KEY.rating)
      newParams.delete(RANGE_PARAM_KEY.rank)
      newParams.delete('nsfw')
      resetOffset(newParams)
      return newParams
    })
  }, [setSearchParams, onChange])

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
    const filter = {
      type: typeFilters,
      tag: tagFilters,
      metaTag: metaTagFilters,
      airDate: airDateFilters,
      rating: ratingFilters,
      rank: rankFilters,
      nsfw,
    } satisfies NonNullable<SearchParam['filter']>
    const hasFilter =
      filter.type.length > 0 ||
      filter.tag.length > 0 ||
      filter.metaTag.length > 0 ||
      filter.airDate.length > 0 ||
      filter.rating.length > 0 ||
      filter.rank.length > 0 ||
      filter.nsfw

    if (!keyword && !hasFilter) return null

    return {
      keyword: keyword || undefined,
      filter,
      sort,
    }
  }, [
    keyword,
    typeFilters,
    tagFilters,
    metaTagFilters,
    airDateFilters,
    ratingFilters,
    rankFilters,
    nsfw,
    sort,
  ])

  return {
    keyword,
    sort,
    typeFilters,
    tagFilters,
    metaTagFilters,
    airDateFilters,
    ratingFilters,
    rankFilters,
    nsfw,
    offset,
    setKeyword,
    setSort,
    setTypeFilters,
    setTagFilters: (values: string[]) => setArrayFilter('tag', values),
    setMetaTagFilters: (values: string[]) => setArrayFilter('metaTag', values),
    setAirDateFilters: (values: string[]) => setRangeFilter('airDate', values),
    setRatingFilters: (values: string[]) => setRangeFilter('rating', values),
    setRankFilters: (values: string[]) => setRangeFilter('rank', values),
    setNsfw,
    clearFilters,
    setOffset,
    getSearchParam,
  }
}
