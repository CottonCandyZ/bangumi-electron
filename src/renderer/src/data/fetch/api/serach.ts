import { apiFetch, SEARCH } from '@renderer/data/fetch/config'
import { SearchDataPage, SearchParm } from '@renderer/data/types/search'

export async function searchV0({
  limit,
  offset,
  searchParm,
}: {
  limit?: number
  offset: number
  searchParm: SearchParm
}) {
  const result = await apiFetch<SearchDataPage>(SEARCH.V0, {
    query: {
      limit,
      offset,
    },
    body: { ...searchParm },
  })
  return result
}
