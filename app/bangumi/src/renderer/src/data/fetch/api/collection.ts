import {
  apiFetchWithAuth,
  CHARACTERS,
  COLLECTIONS,
  NEXT_COLLECTIONS,
  NEXT_USERS,
  PERSONS,
  nextFetchWithOptionalAuth,
} from '@renderer/data/fetch/config/'
import { UserInfo } from '@renderer/data/types/user'
import { FetchParamError } from '@renderer/lib/utils/error'
import {
  CollectionData,
  CollectionEpisodes,
  Collections,
  CollectionType,
  EpisodeCollectionType,
  MonoResourceCollection,
  P1CollectionPage,
  P1CollectionResourceType,
  P1ToggleCollectionResourceType,
} from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { APIError, CharacterId, PersonId, SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { FetchError } from 'ofetch'
import { setIndexCollectionByWeb } from '@renderer/data/fetch/web/collection'

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

const MY_P1_COLLECTION_PATH: Record<P1CollectionResourceType, string> = {
  subject: NEXT_COLLECTIONS.SUBJECTS,
  character: NEXT_COLLECTIONS.CHARACTERS,
  person: NEXT_COLLECTIONS.PERSONS,
  index: NEXT_COLLECTIONS.INDEXES,
}

const V0_MONO_COLLECTION_PATH: Record<
  Exclude<P1ToggleCollectionResourceType, 'index'>,
  (resourceId: number) => string
> = {
  character: (resourceId) => CHARACTERS.COLLECT_BY_ID(resourceId.toString()),
  person: (resourceId) => PERSONS.COLLECT_BY_ID(resourceId.toString()),
}

function getUserP1CollectionPath(type: P1CollectionResourceType, username: UserInfo['username']) {
  switch (type) {
    case 'subject':
      return NEXT_USERS.COLLECTION_SUBJECTS_BY_USERNAME(username)
    case 'character':
      return NEXT_USERS.COLLECTION_CHARACTERS_BY_USERNAME(username)
    case 'person':
      return NEXT_USERS.COLLECTION_PERSONS_BY_USERNAME(username)
    case 'index':
      return NEXT_USERS.COLLECTION_INDEXES_BY_USERNAME(username)
  }
}

/** 从 p1 获得收藏列表。username 为空时读取当前登录用户收藏。 */
export async function getP1Collections({
  collectionType,
  limit,
  offset,
  resourceType,
  subjectType,
  username,
}: {
  collectionType?: CollectionType
  limit?: number
  offset: number
  resourceType: P1CollectionResourceType
  subjectType?: SubjectType
  username: UserInfo['username'] | undefined
}) {
  const path = username
    ? getUserP1CollectionPath(resourceType, username)
    : MY_P1_COLLECTION_PATH[resourceType]

  return nextFetchWithOptionalAuth<P1CollectionPage<P1CollectionResourceType>>(path, {
    query: {
      limit,
      offset,
      subjectType: resourceType === 'subject' ? subjectType : undefined,
      type: resourceType === 'subject' ? collectionType : undefined,
    },
  })
}

/** 用用户名和角色 ID 获得角色收藏状态。 */
export async function getCharacterCollectionByIdAndUsername({
  characterId,
  username,
}: {
  characterId: CharacterId | undefined
  username: UserInfo['username'] | undefined
}) {
  if (!characterId) throw new FetchParamError('未获得角色 id')
  if (!username) throw new FetchParamError('未获得用户名')

  try {
    return await apiFetchWithAuth<MonoResourceCollection>(
      COLLECTIONS.CHARACTER_BY_USERNAME_AND_ID(username, characterId),
    )
  } catch (error) {
    if (error instanceof FetchError && error.statusCode === 404) return null
    throw error
  }
}

/** 用用户名和人物 ID 获得人物收藏状态。 */
export async function getPersonCollectionByIdAndUsername({
  personId,
  username,
}: {
  personId: PersonId | undefined
  username: UserInfo['username'] | undefined
}) {
  if (!personId) throw new FetchParamError('未获得人物 id')
  if (!username) throw new FetchParamError('未获得用户名')

  try {
    return await apiFetchWithAuth<MonoResourceCollection>(
      COLLECTIONS.PERSON_BY_USERNAME_AND_ID(username, personId),
    )
  } catch (error) {
    if (error instanceof FetchError && error.statusCode === 404) return null
    throw error
  }
}

/** 角色/人物/目录收藏切换。 */
export async function setResourceCollection({
  collected,
  resourceId,
  resourceType,
}: {
  collected: boolean
  resourceId: number
  resourceType: P1ToggleCollectionResourceType
}) {
  if (resourceType === 'index') {
    return setIndexCollectionByWeb({
      collected,
      indexId: resourceId,
    })
  }

  return apiFetchWithAuth<Record<string, never>>(
    V0_MONO_COLLECTION_PATH[resourceType](resourceId),
    {
      method: collected ? 'POST' : 'DELETE',
    },
  )
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
