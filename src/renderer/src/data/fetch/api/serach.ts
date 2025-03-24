import { apiFetch, SEARCH } from '@renderer/data/fetch/config/'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { SearchDataPage, SearchParam } from '@renderer/data/types/search'

export async function searchV0({
  limit,
  offset,
  searchParam,
  token,
}: {
  limit?: number
  offset: number
  searchParam: SearchParam
  token?: string
}) {
  const result = await apiFetch<SearchDataPage>(SEARCH.V0, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
    },
    query: {
      limit,
      offset,
    },
    body: {
      keyword: searchParam.keyword,
      sort: searchParam.sort,
      filter: {
        type: searchParam.filter?.type,
        tag: searchParam.filter?.tag,
        air_date: searchParam.filter?.airDate,
        rating: searchParam.filter?.rating,
        rank: searchParam.filter?.rank,
        nsfw: searchParam.filter?.nsfw,
      },
    },
  })
  return result
}
