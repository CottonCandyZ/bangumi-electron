import { subject, subjectCollection, subjectRate, subjectRatingCount, subjectTags } from '@db/index'
import { SubjectId } from '@renderer/data/types/bgm'
import { Subject } from '@renderer/data/types/subject'
import { db } from '@renderer/lib/db/bridge'
import { returnFirstOrNull } from '@renderer/lib/utils/data-trans'
import { FetchParamError } from '@renderer/lib/utils/error'
import { eq } from 'drizzle-orm'
import { BatchItem } from 'drizzle-orm/batch'

export async function readSubjectInfoById({ id }: { id?: SubjectId }) {
  if (!id) throw new FetchParamError('未获得 id')
  return returnFirstOrNull(
    await db.query.subject.findMany({
      where: (subject, { eq }) => eq(subject.id, Number(id)),
      with: {
        collection: true,
        rating: true,
        tags: true,
        ratingCount: true,
      },
    }),
  ) as Subject
}

export async function insertSubjectInfo(subjectInfo: Subject) {
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
      .values(subjectInfo.collection)
      .onConflictDoUpdate({
        target: subjectCollection.subject_id,
        set: {
          ...subjectInfo.collection,
        },
      }),

    db
      .insert(subjectRatingCount)
      .values(subjectInfo.ratingCount)
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
  db.batch(batch)
}
