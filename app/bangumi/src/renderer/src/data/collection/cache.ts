import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { CollectionChange } from '@shared/collection-sync'

// SQLite is the durable cache. Keep only recently used views in renderer memory.
export const localCollectionQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  persister: undefined,
  refetchOnWindowFocus: false,
} as const

export function matchesCollectionChange(key: QueryKey, change: CollectionChange) {
  const [root, account, rawProps] = key
  if (root === 'collection-subjects' && account === 'broadcast-watching')
    return rawProps === change.userId
  if (root === 'collection-removed') return Number(account) === change.userId
  if (!['collection-subject', 'collection-subjects', 'collection-episodes'].includes(String(root)))
    return false
  const props = rawProps as
    | { userId?: number; own?: boolean; subjectId?: string | number }
    | undefined
  if (props?.userId !== change.userId) return false
  if (root !== 'collection-episodes' && !props.own) return false
  return (
    root === 'collection-subjects' ||
    change.subjectIds === null ||
    change.subjectIds.includes(Number(props.subjectId))
  )
}

/** Serialize re-reads and retain changes arriving during a fetch for one trailing refresh. */
export function createCollectionCacheUpdater(client: QueryClient) {
  const pending = new Map<number, Set<number> | null>()
  let running: Promise<void> | undefined
  return (change: CollectionChange) => {
    const previous = pending.get(change.userId)
    pending.set(
      change.userId,
      previous === null || change.subjectIds === null
        ? null
        : new Set([...(previous ?? []), ...change.subjectIds]),
    )
    running ??= (async () => {
      while (pending.size) {
        const changes = [...pending].map(([userId, ids]) => ({
          userId,
          subjectIds: ids && [...ids],
        }))
        pending.clear()
        await client.invalidateQueries(
          {
            predicate: (query) =>
              changes.some((change) => matchesCollectionChange(query.queryKey, change)),
          },
          { cancelRefetch: false },
        )
      }
    })().finally(() => {
      running = undefined
    })
    return running
  }
}
