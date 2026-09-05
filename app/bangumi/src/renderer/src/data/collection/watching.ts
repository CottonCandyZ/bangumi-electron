import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userIdAtom } from '@renderer/state/session'
import { client } from '@renderer/lib/client'

/** A local query under the collection invalidation root; edits and sync update it immediately. */
export function useWatchingSubjectIds(enabled: boolean) {
  const userId = Number(useAtomValue(userIdAtom))
  return useQuery({
    queryKey: ['collection-subjects', 'broadcast-watching', userId],
    enabled: enabled && !!userId,
    networkMode: 'always',
    persister: undefined,
    staleTime: Infinity,
    queryFn: async () => {
      const page = await client.collectionList({
        userId,
        collectionType: 3,
        limit: Number.MAX_SAFE_INTEGER,
      })
      return page.data.map((item) => item.subject_id)
    },
  })
}
