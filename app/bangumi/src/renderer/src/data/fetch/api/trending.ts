import { NEXT_SUBJECTS, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import { SubjectType, type P1Page, type P1SlimSubject } from '@renderer/data/types/subject'
import type { SectionPath, TopList } from '@renderer/data/types/web'

export const TRENDING_PAGE_SIZE = 24

export type TrendingSubjectsPage = {
  data: TopList[]
  nextOffset: number | undefined
}

export async function getTrendingSubjects({
  sectionPath,
  offset = 0,
  signal,
}: {
  sectionPath: SectionPath
  offset?: number
  signal?: AbortSignal
}): Promise<TrendingSubjectsPage> {
  let nextOffset = offset
  let response: P1Page<{ subject: P1SlimSubject; count: number }>
  do {
    response = await nextFetchWithOptionalAuth<typeof response>(NEXT_SUBJECTS.TRENDS, {
      query: { type: SubjectType[sectionPath], limit: TRENDING_PAGE_SIZE, offset: nextOffset },
      signal,
    })
    // The server slices before filtering invisible subjects. Skip fully hidden pages so an
    // empty first page cannot strand the carousel or prevent the virtual list from loading more.
    nextOffset += TRENDING_PAGE_SIZE
  } while (response.data.length === 0 && nextOffset < response.total)

  return {
    data: response.data.map(({ subject }) => ({ SubjectId: String(subject.id) })),
    nextOffset: nextOffset < response.total ? nextOffset : undefined,
  }
}
