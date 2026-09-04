import { client } from '@renderer/lib/client'
import { currentCollectionUser } from '@renderer/data/collection/client'
import type { SubjectId } from '@renderer/data/types/bgm'
import { CollectionType, EpisodeCollectionType } from '@renderer/data/types/collection'
import { EpisodeType } from '@renderer/data/types/episode'
export async function checkEpisodeFinished({ subjectId }: { subjectId: SubjectId }) {
  const userId = currentCollectionUser()
  const record = await client.collectionState({ userId, subjectId: Number(subjectId) })
  if (!record?.local.episodesComplete || record.local.collection?.type !== CollectionType.watching)
    return null
  const all = await client.collectionReadEpisodes({
    userId,
    subjectId: Number(subjectId),
    limit: 1000000,
  })
  const main = all.data?.filter((item) => item.episode.type === EpisodeType.本篇) ?? []
  if (
    !main.length ||
    main.length < record.subject.eps ||
    !main.every((item) => item.type === EpisodeCollectionType.watched)
  )
    return null
  const subjectCollection = await client.collectionRead({ userId, subjectId: Number(subjectId) })
  return subjectCollection
    ? { subjectCollection, subjectInfo: { tags: record.subject.tags } }
    : null
}
