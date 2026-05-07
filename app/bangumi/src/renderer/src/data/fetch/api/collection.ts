import { apiFetchWithAuth, COLLECTIONS } from '@renderer/data/fetch/config/'
import { UserInfo } from '@renderer/data/types/user'
import { FetchParamError } from '@renderer/lib/utils/error'
import {
  CollectionData,
  CollectionEpisodes,
  Collections,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { APIError, SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { FetchError } from 'ofetch'

/** 用用户名获得条目收藏 */
export async function getSubjectCollectionsByUsernameMustAuth({
  username,
  subjectType,
  collectionType,
  limit,
  offset,
}: {
  username: UserInfo['username'] | undefined
  subjectType?: SubjectType
  collectionType?: CollectionType
  limit?: number
  offset: number
}) {
  if (!username) throw new FetchParamError('未获得 username')
  const info = await apiFetchWithAuth<Collections>(COLLECTIONS.BY_USERNAME(username), {
    query: {
      subject_type: subjectType,
      type: collectionType,
      limit,
      offset,
    },
  })
  return info
}

/** 用条目 ID 获得章节收藏 */
export function getEpisodesCollectionBySubjectId({
  subjectId,
  limit,
  offset,
  episodeType,
}: {
  subjectId: SubjectId
  limit?: number
  offset?: number
  episodeType?: EpisodeType
}) {
  return apiFetchWithAuth<CollectionEpisodes>(COLLECTIONS.EPISODES_BY_SUBJECT_ID(subjectId), {
    query: {
      limit,
      offset,
      episode_type: episodeType,
    },
  })
}

/** 用条目 ID 和 用户名获得 条目收藏 */
export async function getSubjectCollectionBySubjectIdAndUsername({
  username,
  subjectId,
}: {
  username: UserInfo['username'] | undefined
  subjectId: SubjectId | undefined
}) {
  if (!subjectId) throw new FetchParamError('未获得条目 id')
  if (!username) throw new FetchParamError('未获得用户名')
  let info: null | CollectionData
  try {
    info = await apiFetchWithAuth<CollectionData>(
      COLLECTIONS.BY_USERNAME_AND_SUBJECT_ID(username, subjectId),
    )
  } catch (e) {
    if (e instanceof FetchError && e.statusCode === 404) {
      return null
    } else {
      throw e
    }
  }
  return info
}

export async function AddOrModifySubjectCollectionById({
  subjectId,
  collectionType,
  rate,
  comment,
  isPrivate,
  tags,
  modify = true,
}: {
  subjectId: SubjectId
  modify?: boolean
  collectionType?: CollectionType
  rate?: CollectionData['rate']
  comment?: string
  isPrivate?: boolean
  tags?: string[]
}) {
  const result = await apiFetchWithAuth<APIError | undefined>(
    COLLECTIONS.ADD_OR_MODIFY_SUBJECT_BY_ID(subjectId),
    {
      method: modify ? 'PATCH' : 'POST',
      body: {
        type: collectionType,
        rate,
        comment,
        private: isPrivate,
        tags: tags,
      },
    },
  )
  return result
}

export async function ModifyEpisodeCollectionBySubjectId({
  subjectId,
  episodesId,
  episodeCollectionType,
}: {
  subjectId: SubjectId
  episodesId: number[]
  episodeCollectionType: EpisodeCollectionType
}) {
  const result = await apiFetchWithAuth<APIError | undefined>(
    COLLECTIONS.MODIFY_EPISODE_BY_SUBJECT_ID(subjectId),
    {
      method: 'PATCH',
      body: {
        type: episodeCollectionType,
        episode_id: episodesId,
      },
    },
  )
  return result
}
