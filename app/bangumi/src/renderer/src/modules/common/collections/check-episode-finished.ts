import { getSubjectCollectionBySubjectIdAndUsername } from '@renderer/data/fetch/api/collection'
import { getSubjectById } from '@renderer/data/fetch/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import {
  CollectionData,
  CollectionEpisodes,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { EpisodeType } from '@renderer/data/types/episode'
import { Subject } from '@renderer/data/types/subject'
import { UserInfo } from '@renderer/data/types/user'
import { QueryClient, QueryKey } from '@tanstack/react-query'

export async function checkEpisodeFinished({
  queryClient,
  subjectId,
  username,
  episodesQueryKey,
  subjectCollectionQueryKey,
  subjectInfoQueryKey,
}: {
  queryClient: QueryClient
  subjectId: SubjectId
  username: UserInfo['username'] | undefined
  episodesQueryKey: QueryKey
  subjectCollectionQueryKey: QueryKey
  subjectInfoQueryKey: QueryKey
}) {
  if (!username) return null

  const collectionEpisodes = queryClient.getQueryData<CollectionEpisodes>(episodesQueryKey)
  const episodes = collectionEpisodes?.data
  if (!episodes || episodes.length === 0) return null

  const mainEpisodes = episodes.filter((episode) => episode.episode.type === EpisodeType.本篇)
  if (mainEpisodes.length === 0) return null
  const isFinished = mainEpisodes.every((episode) => episode.type === EpisodeCollectionType.watched)
  if (!isFinished) return null

  const subjectCollectionInCache = queryClient.getQueryData<CollectionData | null | undefined>(
    subjectCollectionQueryKey,
  )
  const subjectCollection =
    subjectCollectionInCache === undefined
      ? await getSubjectCollectionBySubjectIdAndUsername({ subjectId, username })
      : subjectCollectionInCache
  if (subjectCollectionInCache === undefined) {
    queryClient.setQueryData(subjectCollectionQueryKey, subjectCollection)
  }
  if (!subjectCollection || subjectCollection.type !== CollectionType.watching) return null

  const subjectInfoInCache = queryClient.getQueryData<Subject | undefined>(subjectInfoQueryKey)
  const subjectInfo = subjectInfoInCache ?? (await getSubjectById({ id: Number(subjectId) }))
  if (subjectInfoInCache === undefined) {
    queryClient.setQueryData(subjectInfoQueryKey, subjectInfo)
  }

  return {
    subjectCollection,
    subjectInfo,
  }
}
