import type Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import pinyin from 'pinyin'
import {
  subject,
  subjectCollection,
  subjectRate,
  subjectRatingCount,
  subjectTags,
} from '../../db/schema/subject'
import type { Subject } from '../../shared/types/subject'

function buildNameCnPinyin(nameCn: string | null | undefined): string | null {
  const trimmed = nameCn?.trim()
  if (!trimmed) return null
  const words = (parts: string[][]) =>
    parts
      .map((part) => part[0])
      .filter(Boolean)
      .map((part) => part.toLowerCase())
  const normalize = (parts: string[], initials: string) =>
    [parts.join(' '), parts.join(''), parts.map((part) => part[0] ?? '').join(''), initials]
      .filter(Boolean)
      .join(' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || null
  try {
    const parts = words(pinyin(trimmed, { style: 'normal', segment: true, group: true }))
    const initials = words(pinyin(trimmed, { style: 'normal', segment: true }))
      .map((part) => part[0] ?? '')
      .join('')
    const indexed = normalize(parts, initials)
    if (indexed) return indexed
  } catch {
    // Segmentation is optional. Keep a syllable index when it is unavailable.
  }
  try {
    const parts = words(pinyin(trimmed, { style: 'normal' }))
    return normalize(parts, parts.map((part) => part[0] ?? '').join(''))
  } catch {
    return null
  }
}

/** Send each subject once over IPC; build its search index and SQL in the database worker. */
export function saveSubjects(sqlite: Database.Database, subjects: Subject[]) {
  const db = drizzle(sqlite)
  sqlite.transaction(() => {
    for (const item of subjects) {
      const values = { ...item, name_cn_pinyin: buildNameCnPinyin(item.name_cn) }
      db.insert(subject)
        .values(values)
        .onConflictDoUpdate({ target: subject.id, set: values })
        .run()
      db.insert(subjectRate)
        .values({ subject_id: item.id, ...item.rating })
        .onConflictDoUpdate({ target: subjectRate.subject_id, set: item.rating })
        .run()
      db.insert(subjectCollection)
        .values({ subject_id: item.id, ...item.collection })
        .onConflictDoUpdate({ target: subjectCollection.subject_id, set: item.collection })
        .run()
      db.insert(subjectRatingCount)
        .values({ subject_id: item.id, ...item.ratingCount })
        .onConflictDoUpdate({ target: subjectRatingCount.subject_id, set: item.ratingCount })
        .run()
      db.delete(subjectTags).where(eq(subjectTags.subject_id, item.id)).run()
      if (item.tags.length)
        db.insert(subjectTags)
          .values(item.tags.map((tag) => ({ subject_id: item.id, ...tag })))
          .run()
    }
  })()
}
