import { client } from '@renderer/lib/client'
import { queryClient } from '@renderer/modules/wrapper/query'
import { store } from '@renderer/state/utils'
import { userIdAtom } from '@renderer/state/session'
import type { CollectionFields, CollectionCommand } from '@shared/collection-sync'
import type { Subject } from '@shared/types/subject'
import { getAccessToken } from '@renderer/data/fetch/session'

export function currentCollectionUser() {
  const userId = Number(store.get(userIdAtom))
  if (!userId) throw new Error('请先登录后管理收藏')
  return userId
}
export async function invalidateCollections() {
  await Promise.all(
    [
      'collection-subject',
      'collection-subjects',
      'collection-episodes',
      'collection-sync',
      'collection-removed',
    ].map((root) => queryClient.invalidateQueries({ queryKey: [root] })),
  )
}
export async function submitCollection(
  command:
    | Omit<Extract<CollectionCommand, { kind: 'edit' }>, 'actionId' | 'userId'>
    | Omit<Extract<CollectionCommand, { kind: 'remove' }>, 'actionId' | 'userId'>
    | Omit<Extract<CollectionCommand, { kind: 'episodes' }>, 'actionId' | 'userId'>,
) {
  const userId = currentCollectionUser()
  const result = await client.collectionCommand({
    ...command,
    userId,
    actionId: crypto.randomUUID(),
  })
  // Refresh credentials only after the durable local write, without delaying the UI.
  void getAccessToken(String(userId)).catch(() => {})
  await invalidateCollections()
  return result
}
export async function editLocalCollection(input: {
  subjectId: string
  collectionType?: CollectionFields['type']
  rate?: CollectionFields['rate']
  comment?: string
  tags?: string[]
  isPrivate?: boolean
  modify?: boolean
}) {
  const patch: Partial<CollectionFields> = {}
  if (input.collectionType !== undefined) patch.type = input.collectionType
  if (input.rate !== undefined) patch.rate = input.rate
  if (input.comment !== undefined) patch.comment = input.comment
  if (input.tags !== undefined) patch.tags = input.tags
  if (input.isPrivate !== undefined) patch.private = input.isPrivate
  const cached = queryClient
    .getQueriesData<Subject>({ queryKey: ['subject-info'] })
    .map(([, data]) => data)
    .find((data) => data?.id === Number(input.subjectId))
  await submitCollection({
    kind: 'edit',
    subjectId: Number(input.subjectId),
    patch,
    subject: cached
      ? {
          id: cached.id,
          type: cached.type,
          date: cached.date,
          name: cached.name,
          name_cn: cached.name_cn,
          images: cached.images,
          tags: cached.tags,
          eps: cached.eps,
          volumes: cached.volumes,
          score: cached.rating.score,
          rank: cached.rating.rank,
          collection_total: Object.values(cached.collection).reduce((a, b) => a + b, 0),
        }
      : undefined,
  })
}
export async function editLocalEpisodes(input: {
  subjectId: string
  episodesId: number[]
  episodeCollectionType: 0 | 1 | 2 | 3
}) {
  await submitCollection({
    kind: 'episodes',
    subjectId: Number(input.subjectId),
    episodes: Object.fromEntries(input.episodesId.map((id) => [id, input.episodeCollectionType])),
  })
}
