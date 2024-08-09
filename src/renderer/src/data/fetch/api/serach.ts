import { apiFetch, SEARCH } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { SearchDataPage, SearchParm } from '@renderer/data/types/search'

export async function searchV0({
  limit,
  offset,
  searchParm,
  token,
}: {
  limit?: number
  offset: number
  searchParm: SearchParm
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
      keyword: searchParm.keyword,
      sort: searchParm.sort,
      filter: {
        type: searchParm.filter?.type,
        tag: searchParm.filter?.tag,
        air_date: searchParm.filter?.airDate,
        rating: searchParm.filter?.rating,
        rank: searchParm.filter?.rank,
        nsfw: searchParm.filter?.nsfw,
      },
    },
  })
  return result
}
