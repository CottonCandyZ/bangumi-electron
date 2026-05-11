import {
  COLLECTIONS,
  NEXT_USERS,
  USER,
  apiFetchWithAuth,
  apiFetchWithOptionalAuth,
  nextFetch,
} from '@renderer/data/fetch/config/'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { UserInfo, UserProfile, UserTimelineItem, UerInfoAPI } from '@renderer/data/types/user'
import dayjs from 'dayjs'

/**
 * v0 接口拿 UserInfo
 */
export async function getUserInfoWithAuth() {
  return await apiFetchWithAuth<UerInfoAPI>(USER.ME)
}

/**
 * v0 接口按 username 拿公开 UserInfo
 */
export async function getUserInfoByUsername({
  username,
}: {
  username: UserInfo['username'] | undefined
}) {
  if (!username) return null
  return await apiFetchWithOptionalAuth<UerInfoAPI>(USER.BY_USERNAME(username))
}

/**
 * p1 接口拿用户主页信息，包含 bio、统计与主页布局。
 */
export async function getUserProfileByUsername({
  username,
}: {
  username: UserInfo['username'] | undefined
}) {
  if (!username) return null
  return await nextFetch<UserProfile>(NEXT_USERS.BY_USERNAME(username))
}

/**
 * p1 接口拿用户时间胶囊。
 */
export async function getUserTimelineByUsername({
  username,
  limit,
  until,
}: {
  username: UserInfo['username'] | undefined
  limit?: number
  until?: number
}) {
  if (!username) return []
  const timeline = await nextFetch<UserTimelineItem[]>(NEXT_USERS.TIMELINE_BY_USERNAME(username), {
    query: {
      limit,
      until,
    },
  })
  try {
    return await fillEmptySubjectTimelineItems(username, timeline)
  } catch {
    return timeline
  }
}

type CollectionFetchParams = {
  collectionType: CollectionType
  subjectType?: SubjectType
}

const TIMELINE_SUBJECT_COLLECTION_PARAMS: Partial<Record<number, CollectionFetchParams>> = {
  2: { subjectType: SubjectType.anime, collectionType: CollectionType.wantToWatch },
  4: { subjectType: SubjectType.game, collectionType: CollectionType.wantToWatch },
  6: { subjectType: SubjectType.anime, collectionType: CollectionType.watched },
  8: { subjectType: SubjectType.game, collectionType: CollectionType.watched },
  10: { subjectType: SubjectType.anime, collectionType: CollectionType.watching },
  13: { collectionType: CollectionType.aside },
  14: { collectionType: CollectionType.abandoned },
}

async function fillEmptySubjectTimelineItems(
  username: UserInfo['username'],
  timeline: UserTimelineItem[],
) {
  const itemsWithEmptySubjects = timeline.filter(
    (item) =>
      item.cat === 3 &&
      item.memo.subject !== undefined &&
      item.memo.subject.length === 0 &&
      TIMELINE_SUBJECT_COLLECTION_PARAMS[item.type],
  )

  if (itemsWithEmptySubjects.length === 0) return timeline

  const collectionCache = new Map<string, Promise<CollectionData[]>>()

  const filledItems = await Promise.all(
    timeline.map(async (item) => {
      if (!itemsWithEmptySubjects.includes(item)) return item

      const params = TIMELINE_SUBJECT_COLLECTION_PARAMS[item.type]
      if (!params) return item

      const cacheKey = `${params.subjectType ?? 'all'}-${params.collectionType}`
      const collectionsPromise =
        collectionCache.get(cacheKey) ??
        getTimelineFallbackCollections({
          username,
          ...params,
        })
      collectionCache.set(cacheKey, collectionsPromise)

      const collections = await collectionsPromise
      const collection = findCollectionUpdatedNearTimelineItem(collections, item.createdAt)
      if (!collection) return item

      return {
        ...item,
        memo: {
          ...item.memo,
          subject: [
            {
              subject: toTimelineSubject(collection),
              comment: collection.comment ?? '',
              rate: collection.rate,
              collectID: collection.subject_id,
            },
          ],
        },
      }
    }),
  )

  return filledItems
}

async function getTimelineFallbackCollections({
  username,
  subjectType,
  collectionType,
}: CollectionFetchParams & { username: UserInfo['username'] }) {
  const collections = await apiFetchWithOptionalAuth<{ data: CollectionData[] }>(
    COLLECTIONS.BY_USERNAME(username),
    {
      query: {
        subject_type: subjectType,
        type: collectionType,
        limit: 20,
        offset: 0,
      },
    },
  )
  return collections.data
}

function findCollectionUpdatedNearTimelineItem(collections: CollectionData[], timestamp: number) {
  return collections.find((collection) => {
    const updatedAt = dayjs(collection.updated_at)
    if (!updatedAt.isValid()) return false
    return Math.abs(updatedAt.unix() - timestamp) <= 60
  })
}

function toTimelineSubject(
  collection: CollectionData,
): NonNullable<UserTimelineItem['memo']['subject']>[number]['subject'] {
  const subject = collection.subject

  return {
    id: subject.id,
    name: subject.name,
    nameCN: subject.name_cn,
    type: subject.type,
    images: subject.images,
    info: '',
    rating: {
      rank: subject.rank,
      total: collection.subject.collection_total,
      score: subject.score,
      count: [],
    },
    locked: false,
    nsfw: false,
  }
}
