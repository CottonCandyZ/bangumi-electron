import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userIdAtom } from '@renderer/state/session'
import { client } from '@renderer/lib/client'

/** Only fetch the watching anime list; no full-library or episode scan is needed. */
export function useWatchingSubjectIds(enabled: boolean) {
  const userId = Number(useAtomValue(userIdAtom))
  return useQuery({
    queryKey: ['collection-subjects', 'broadcast-watching', userId],
    enabled: enabled && !!userId,
    networkMode: 'always',
    persister: undefined,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const ids = new Set<number>()
      let offset = 0
      let total = Infinity
      while (offset < total) {
        const page = await client.collectionList({
          userId,
          subjectType: 2,
          collectionType: 3,
          offset,
          limit: 50,
          online: navigator.onLine,
        })
        for (const item of page.data) ids.add(item.subject_id)
        offset += page.limit
        total = page.total
      }
      return [...ids]
    },
  })
}
