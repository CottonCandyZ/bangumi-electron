import { client } from '@renderer/lib/client'
import { CollectionPendingError } from '@renderer/lib/utils/network'
import type { EpisodeType } from '@renderer/data/types/episode'

// IPC reads may finish before the sync-complete notification is handled. Re-read
// only unresolved local snapshots; successful and failed requests stop polling.
export function pendingCollectionInterval(query: { state: { error: Error | null } }) {
  return navigator.onLine && query.state.error instanceof CollectionPendingError ? 1000 : false
}

async function pendingCollection(input: { userId: number; subjectId: number }): Promise<never> {
  const record = await client.collectionState(input)
  if (record?.error) throw new Error(record.error)
  throw new CollectionPendingError()
}

export async function readLocalSubject(input: { userId: number; subjectId: number }) {
  const collection = await client.collectionRead(input)
  if (collection === undefined) return pendingCollection(input)
  return collection
}

export async function readLocalEpisodes(props: {
  userId: number
  subjectId: string
  limit: number
  offset: number
  episodeType: EpisodeType | undefined
}) {
  const input = { ...props, subjectId: Number(props.subjectId) }
  const episodes = await client.collectionReadEpisodes(input)
  if (!episodes.ready) return pendingCollection(input)
  return episodes
}
