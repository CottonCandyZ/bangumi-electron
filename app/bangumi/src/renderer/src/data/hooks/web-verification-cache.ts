import type { QueryClient } from '@tanstack/react-query'
import type { SectionPath, TopList } from '@renderer/data/types/web'
import {
  isWebVerificationRequiredError,
  markWebVerificationComplete,
} from '../fetch/config/web-access'

export async function restoreQueriesAfterWebVerification(
  queryClient: QueryClient,
  lists: Partial<Record<SectionPath, TopList[]>>,
) {
  const affected = ({
    queryKey,
    state,
  }: {
    queryKey: readonly unknown[]
    state: { error: unknown }
  }) =>
    queryKey[0] === 'SectionTrendsV2' ||
    queryKey[0] === 'SectionTrendsInfiniteV2' ||
    isWebVerificationRequiredError(state.error)
  // Stop old query results from replacing the freshly verified pages.
  await queryClient.cancelQueries({ predicate: affected })
  markWebVerificationComplete()
  for (const [sectionPath, topList] of Object.entries(lists)) {
    queryClient.setQueryData(['SectionTrendsV2', sectionPath], topList)
    queryClient.setQueryData(['SectionTrendsInfiniteV2', sectionPath], {
      pages: [topList],
      pageParams: [1],
    })
  }
  // Only retry missing categories and other reads blocked by the same site gate.
  await queryClient.invalidateQueries({
    predicate: (query) =>
      affected(query) &&
      !(
        (query.queryKey[0] === 'SectionTrendsV2' ||
          query.queryKey[0] === 'SectionTrendsInfiniteV2') &&
        Object.hasOwn(lists, String(query.queryKey[1]))
      ),
  })
}
