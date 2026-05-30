import { apiFetchWithOptionalAuth, SEARCH } from '@renderer/data/fetch/config/'
import { SearchDataPage, SearchParam } from '@renderer/data/types/search'

const nonEmpty = <T>(value: T[] | undefined) => (value && value.length > 0 ? value : undefined)

export async function searchV0({
  limit,
  offset,
  searchParam,
}: {
  limit?: number
  offset: number
  searchParam: SearchParam
}) {
  const category = searchParam.category ?? 'subjects'
  const body =
    category === 'subjects'
      ? {
          keyword: searchParam.keyword ?? '',
          sort: searchParam.sort,
          filter: {
            type: nonEmpty(searchParam.filter?.type),
            tag: nonEmpty(searchParam.filter?.tag),
            meta_tags: nonEmpty(searchParam.filter?.metaTag),
            air_date: nonEmpty(searchParam.filter?.airDate),
            rating: nonEmpty(searchParam.filter?.rating),
            rank: nonEmpty(searchParam.filter?.rank),
            nsfw: searchParam.filter?.nsfw || undefined,
          },
        }
      : {
          keyword: searchParam.keyword ?? '',
        }

  const result = await apiFetchWithOptionalAuth<Omit<SearchDataPage, 'limit' | 'offset'>>(
    SEARCH.V0(category),
    {
      method: 'POST',
      query: {
        limit,
        offset,
      },
      body,
    },
  )
  return {
    ...result,
    limit: limit ?? 20,
    offset,
  }
}
