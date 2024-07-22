import { apiFetch, COLLECTIONS } from '@renderer/data/fetch/config'
import { getAuthHeader } from '@renderer/data/fetch/utils'
import { UserInfo } from '@renderer/data/types/user'
import { FetchParamError } from '@renderer/lib/utils/error'
import { Collections, CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'

export async function getCollectionsByUsername({
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
