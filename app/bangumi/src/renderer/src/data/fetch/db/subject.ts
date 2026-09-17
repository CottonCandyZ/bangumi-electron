import { subject } from '@db/index'
import { Subject } from '@renderer/data/types/subject'
import { db } from '@renderer/lib/db/bridge'
import { returnFirstOrUndefined } from '@renderer/lib/utils/data-trans'
import { FetchParamError } from '@renderer/lib/utils/error'
import { and, desc, eq, like, or } from 'drizzle-orm'
import { client } from '@renderer/lib/client'

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

export async function insertSubjectsInfo(subjectsInfo: Subject[]) {
  if (subjectsInfo.length) await client.dbSaveSubjects(subjectsInfo)
}

export async function insertSubjectInfo(subjectInfo: Subject) {
  await client.dbSaveSubjects([subjectInfo])
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
