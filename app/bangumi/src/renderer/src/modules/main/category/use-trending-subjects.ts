import { useSubjectsInfoQuery } from '@renderer/data/hooks/db/subject'
import { useTopListQuery } from '@renderer/data/hooks/trending-subjects'
import type { Subject } from '@renderer/data/types/subject'
import type { SectionPath } from '@renderer/data/types/web'
import { useOnline } from '@renderer/hooks/use-online'
import { userIdAtom } from '@renderer/state/session'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

export function useVisibleSubjects(ids: string[] | undefined) {
  const userId = useAtomValue(userIdAtom)
  const query = useSubjectsInfoQuery({ subjectIds: ids, enabled: !!ids })
  const subjects = useMemo(
    () =>
      ids?.length === 0
        ? []
        : query.data?.filter(
            (subject): subject is Subject => !!subject && (!!userId || !subject.nsfw),
          ),
    [ids?.length, query.data, userId],
  )
  return { query, subjects }
}

export function useTrendingSubjects(sectionPath: SectionPath, heroCount: number) {
  const online = useOnline()
  const topList = useTopListQuery(sectionPath)
  const ids = useMemo(
    () => topList.data?.map((item) => item.SubjectId).filter((id) => id !== undefined),
    [topList.data],
  )
  const { query, subjects } = useVisibleSubjects(ids)
  // Subjects stream in one by one; the hero waits for its head (plus slack for hidden NSFW
  // entries) so it lays out once instead of on every arrival.
  const heroSettled =
    !!query.data &&
    (!query.isFetching || query.data.slice(0, heroCount + 4).every((subject) => subject !== null))
  return {
    subjects,
    heroSubjects: heroSettled ? subjects?.slice(0, heroCount) : undefined,
    failed: (topList.data === undefined && (topList.isError || !online)) || query.isError,
    error: topList.error ?? query.error,
    refreshing: topList.isRefreshing,
    refetch: () => {
      void query.refetch()
      return topList.refetch()
    },
  }
}
