import { apiFetch, COLLECTIONS } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { UserInfo } from '@renderer/data/types/user'
import { FetchParamError } from '@renderer/lib/utils/error'
import {
  CollectionData,
  CollectionEpisodes,
  Collections,
  CollectionType,
} from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { APIError, SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { FetchError } from 'ofetch'

/** 用用户名获得条目收藏 */
export async function getSubjectCollectionsByUsername({
  username,
  subjectType,
  collectionType,
  token,
  limit,
  offset,
}: {
  username: UserInfo['username'] | undefined
  subjectType?: SubjectType
  collectionType?: CollectionType
  token?: string
  limit?: number
  offset: number
}) {
  if (!username) throw new FetchParamError('未获得 username')
  const info = await apiFetch<Collections>(COLLECTIONS.BY_USERNAME(username), {
    query: {
      subject_type: subjectType,
      type: collectionType,
      limit,
      offset,
    },
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}

/** 用条目 ID 和 token 获得 章节收藏 */
export async function getEpisodesCollectionBySubjectId({
  subjectId,
  limit,
  offset,
  episodeType,
  token,
}: {
  subjectId: SubjectId | undefined
  limit?: number
  offset?: number
  episodeType?: EpisodeType
  token: string
}) {
  if (!subjectId) throw new FetchParamError('未获得 id')

  const info = await apiFetch<CollectionEpisodes>(COLLECTIONS.EPISODES_BY_SUBJECT_ID(subjectId), {
    query: {
      limit,
      offset,
      episode_type: episodeType,
    },
    headers: {
      ...getAuthHeader(token),
    },
  })
  return info
}

/** 用条目 ID 和 用户名获得 条目收藏 */
export async function getSubjectCollectionBySubjectIdAndUsername({
  username,
  subjectId,
  token,
}: {
  username: UserInfo['username'] | undefined
  subjectId: SubjectId | undefined
  token?: string
}) {
  if (!subjectId) throw new FetchParamError('未获得条目 id')
  if (!username) throw new FetchParamError('未获得用户名')
  let info: null | CollectionData
  try {
    info = await apiFetch<CollectionData>(
      COLLECTIONS.BY_USERNAME_AND_SUBJECT_ID(username, subjectId),
      {
        headers: {
          ...getAuthHeader(token),
        },
      },
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
  token,
  collectionType,
  rate,
  comment,
  isPrivate,
  tags,
  modify = true,
}: {
  subjectId: SubjectId
  token: string
  modify?: boolean
  collectionType?: CollectionType
  rate?: CollectionData['rate']
  comment?: string
  isPrivate?: boolean
  tags?: string[]
}) {
  if (!subjectId) throw new FetchParamError('未获得 id')
  const result = await apiFetch<APIError | undefined>(
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
      headers: {
        ...getAuthHeader(token),
      },
    },
  )
  return result
}
