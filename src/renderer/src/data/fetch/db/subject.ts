import { subject, subjectCollection, subjectRate, subjectRatingCount, subjectTags } from '@db/index'
import { Subject } from '@renderer/data/types/subject'
import { db } from '@renderer/lib/db/bridge'
import { returnFirstOrUndefined } from '@renderer/lib/utils/data-trans'
import { FetchParamError } from '@renderer/lib/utils/error'
import { eq } from 'drizzle-orm'
import { BatchItem } from 'drizzle-orm/batch'

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
  const batch: [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] = [
    db
      .insert(subject)
      .values(subjectInfo)
      .onConflictDoUpdate({
        target: subject.id,
        set: {
          ...subjectInfo,
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
