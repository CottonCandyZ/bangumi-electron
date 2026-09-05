import type { QueryClient } from '@tanstack/react-query'
import type { SectionPath, TopList } from '@renderer/data/types/web'
import { markWebVerificationComplete } from '../fetch/config/web-access'

export async function restoreQueriesAfterWebVerification(
  queryClient: QueryClient,
  sectionPath: SectionPath,
  topList: TopList[],
) {
  markWebVerificationComplete()
  queryClient.setQueryData(['SectionTrendsV2', sectionPath], topList)
  queryClient.setQueryData(['SectionTrendsInfiniteV2', sectionPath], {
    pages: [topList],
    pageParams: [1],
  })
  // Mounted categories resume through the shared serial trends queue. Inactive ones
  // remain stale until opened; the verified category already has fresh response data.
  await queryClient.invalidateQueries({
    predicate: ({ queryKey }) =>
      (queryKey[0] === 'SectionTrendsV2' || queryKey[0] === 'SectionTrendsInfiniteV2') &&
      queryKey[1] !== sectionPath,
  })
}
