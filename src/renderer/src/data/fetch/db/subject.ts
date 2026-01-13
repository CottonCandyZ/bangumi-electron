import { subject, subjectCollection, subjectRate, subjectRatingCount, subjectTags } from '@db/index'
import { Subject } from '@renderer/data/types/subject'
import { db } from '@renderer/lib/db/bridge'
import { returnFirstOrUndefined } from '@renderer/lib/utils/data-trans'
import { FetchParamError } from '@renderer/lib/utils/error'
import { and, desc, eq, like, or } from 'drizzle-orm'
import { BatchItem } from 'drizzle-orm/batch'
import pinyin from 'pinyin'

function buildNameCnPinyin(nameCn: string | null | undefined): string | null {
  const trimmed = nameCn?.trim()
  if (!trimmed) return null

  const toString = (arr: string[][]) =>
    arr
      .map((item) => item[0])
      .filter(Boolean)
      .map((s) => s.toLowerCase())

  const toNormalizedIndex = (words: string[], syllableInitials?: string) => {
    const spaced = words.join(' ')
    const compact = words.join('')
    const wordInitials = words.map((w) => w[0] ?? '').join('')

    const merged = [spaced, compact, wordInitials, syllableInitials].filter(Boolean).join(' ')
    const normalized = merged
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return normalized || null
  }

  try {
    const words = toString(pinyin(trimmed, { style: 'normal', segment: true, group: true }))
    const syllables = toString(pinyin(trimmed, { style: 'normal', segment: true }))
    const syllableInitials = syllables.map((w) => w[0] ?? '').join('')
    const indexed = toNormalizedIndex(words, syllableInitials)
    if (indexed) return indexed
  } catch {
    // Ignore and fallback below.
  }

  try {
    const words = toString(pinyin(trimmed, { style: 'normal' }))
    const syllableInitials = words.map((w) => w[0] ?? '').join('')
    return toNormalizedIndex(words, syllableInitials)
  } catch {
    return null
  }
}

export async function readSubjectInfoById({ id }: { id?: number }) {
  if (!id) throw new FetchParamError('未获得 id')
  return returnFirstOrUndefined(
    await db.query.subject.findMany({
      where: (subject, { eq }) => eq(subject.id, Number(id)),
      with: {
        collection: {
          columns: {
            subject_id: false,
          },
        },
        rating: {
          columns: {
            subject_id: false,
          },
        },
        tags: {
          columns: {
            subject_id: false,
          },
        },
        ratingCount: {
          columns: {
            subject_id: false,
          },
        },
      },
      limit: 1,
    }),
  ) as Subject | undefined
}

export async function readSubjectsInfoByIds({ ids }: { ids?: number[] }) {
  if (!ids) throw new FetchParamError('未获得 id')
  return (await db.query.subject.findMany({
    where: (subject, { inArray }) => inArray(subject.id, ids),
    with: {
      collection: {
        columns: {
          subject_id: false,
        },
      },
      rating: {
        columns: {
          subject_id: false,
        },
      },
      tags: {
        columns: {
          subject_id: false,
        },
      },
      ratingCount: {
        columns: {
          subject_id: false,
        },
      },
    },
  })) as Subject[]
}

function createSubjectBatchInsert(subjectInfo: Subject) {
  const subjectWithPinyin = {
    ...subjectInfo,
    name_cn_pinyin: buildNameCnPinyin(subjectInfo.name_cn),
  }
  const batch: [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] = [
    db
      .insert(subject)
      .values(subjectWithPinyin)
      .onConflictDoUpdate({
        target: subject.id,
        set: {
          ...subjectWithPinyin,
        },
      }),

    db
      .insert(subjectRate)
      .values({
        subject_id: subjectInfo.id,
        ...subjectInfo.rating,
      })
      .onConflictDoUpdate({
        target: subjectRate.subject_id,
        set: {
          ...subjectInfo.rating,
        },
      }),

    db
      .insert(subjectCollection)
      .values({
        subject_id: subjectInfo.id,
        ...subjectInfo.collection,
      })
      .onConflictDoUpdate({
        target: subjectCollection.subject_id,
        set: {
          ...subjectInfo.collection,
        },
      }),

    db
      .insert(subjectRatingCount)
      .values({
        subject_id: subjectInfo.id,
        ...subjectInfo.ratingCount,
      })
      .onConflictDoUpdate({
        target: subjectRatingCount.subject_id,
        set: {
          ...subjectInfo.ratingCount,
        },
      }),

    db.delete(subjectTags).where(eq(subjectTags.subject_id, subjectInfo.id)),
  ]
  for (const tag of subjectInfo.tags) {
    batch.push(
      db.insert(subjectTags).values({
        subject_id: subjectInfo.id,
        ...tag,
      }),
    )
  }
  return batch
}

export async function insertSubjectsInfo(subjectsInfo: Subject[]) {
  const batch = subjectsInfo.map((subject) => createSubjectBatchInsert(subject)).flat(1) as [
    BatchItem<'sqlite'>,
    ...BatchItem<'sqlite'>[],
  ]
  if (batch.length === 0) return
  db.batch(batch)
}

export async function insertSubjectInfo(subjectInfo: Subject) {
  const batch = createSubjectBatchInsert(subjectInfo)
  if (batch.length === 0) return
  db.batch(batch)
}

export type SubjectSearchItem = Pick<Subject, 'id' | 'name' | 'name_cn' | 'type'> & {
  name_cn_pinyin: string | null
}

export async function searchSubjectsInDb({
  keyword,
  limit = 20,
}: {
  keyword: string
  limit?: number
}): Promise<SubjectSearchItem[]> {
  const trimmedKeyword = keyword.trim()
  if (!trimmedKeyword) return []

  const tokens = trimmedKeyword.split(/\s+/).filter(Boolean)
  const tokenConditions = tokens.map((token) => {
    const pinyinNeedle = token.toLowerCase().replace(/[^a-z0-9]/g, '')
    const conditions = [like(subject.name_cn, `%${token}%`), like(subject.name, `%${token}%`)]
    if (pinyinNeedle) conditions.push(like(subject.name_cn_pinyin, `%${pinyinNeedle}%`))
    return or(...(conditions as [ReturnType<typeof like>, ...ReturnType<typeof like>[]]))
  })

  const keywordCondition =
    tokenConditions.length === 0
      ? undefined
      : tokenConditions.length === 1
        ? tokenConditions[0]
        : and(...tokenConditions)

  const idCondition = /^\d+$/.test(trimmedKeyword)
    ? eq(subject.id, Number(trimmedKeyword))
    : undefined
  const whereCondition =
    idCondition && keywordCondition
      ? or(idCondition, keywordCondition)
      : (idCondition ?? keywordCondition)

  if (!whereCondition) return []

  return await db
    .select({
      id: subject.id,
      name: subject.name,
      name_cn: subject.name_cn,
      name_cn_pinyin: subject.name_cn_pinyin,
      type: subject.type,
    })
    .from(subject)
    .where(whereCondition)
    .orderBy(desc(subject.last_update_at))
    .limit(limit)
}
