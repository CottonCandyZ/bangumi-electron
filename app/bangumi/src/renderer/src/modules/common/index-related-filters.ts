import type { IndexRelatedCategory, IndexStats } from '@renderer/data/types/index'
import { SubjectType } from '@renderer/data/types/subject'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { INDEX_RELATED_CATEGORY_LABELS } from '@renderer/modules/common/index-related-meta'

export const ALL_INDEX_RELATED_CATEGORIES = '全部内容'
export const ALL_INDEX_RELATED_SUBJECT_TYPES = '全部类型'

export const INDEX_RELATED_CATEGORY_BY_LABEL = new Map(
  Object.entries(INDEX_RELATED_CATEGORY_LABELS).map(([category, label]) => [
    label,
    Number(category) as IndexRelatedCategory,
  ]),
)

export const INDEX_RELATED_SUBJECT_TYPE_BY_LABEL = new Map(
  Object.entries(SUBJECT_TYPE_MAP).map(([type, label]) => [label, Number(type) as SubjectType]),
)

const INDEX_RELATED_CATEGORY_STATS = [
  {
    cat: 0,
    getCount: (stats: IndexStats) =>
      Object.values(stats.subject ?? {}).reduce((sum, count) => sum + (count ?? 0), 0),
  },
  { cat: 1, getCount: (stats: IndexStats) => stats.character ?? 0 },
  { cat: 2, getCount: (stats: IndexStats) => stats.person ?? 0 },
  { cat: 3, getCount: (stats: IndexStats) => stats.episode ?? 0 },
  { cat: 4, getCount: (stats: IndexStats) => stats.blog ?? 0 },
  { cat: 5, getCount: (stats: IndexStats) => stats.groupTopic ?? 0 },
  { cat: 6, getCount: (stats: IndexStats) => stats.subjectTopic ?? 0 },
] satisfies Array<{ cat: IndexRelatedCategory; getCount: (stats: IndexStats) => number }>

const INDEX_RELATED_SUBJECT_TYPE_STATS = [
  { key: 'anime', type: SubjectType.anime },
  { key: 'book', type: SubjectType.book },
  { key: 'game', type: SubjectType.game },
  { key: 'music', type: SubjectType.music },
  { key: 'real', type: SubjectType.real },
] satisfies Array<{ key: keyof IndexStats['subject']; type: SubjectType }>

export function getIndexRelatedCategoryFilters(stats: IndexStats | undefined) {
  if (!stats) return []

  return INDEX_RELATED_CATEGORY_STATS.filter(({ getCount }) => getCount(stats) > 0).map(
    ({ cat }) => ({
      cat,
      label: INDEX_RELATED_CATEGORY_LABELS[cat],
    }),
  )
}

export function getIndexRelatedSubjectTypeFilters(stats: IndexStats | undefined) {
  if (!stats) return []

  return INDEX_RELATED_SUBJECT_TYPE_STATS.filter(({ key }) => (stats.subject?.[key] ?? 0) > 0).map(
    ({ type }) => ({
      label: SUBJECT_TYPE_MAP[type],
      type,
    }),
  )
}

export function shouldShowIndexRelatedCategoryFilter(
  categoryFilters: Array<{ cat: IndexRelatedCategory; label: string }>,
) {
  return categoryFilters.length > 1
}

export function shouldShowIndexRelatedSubjectTypeFilter({
  categoryFilter,
  showCategoryFilter,
  subjectTypeFilters,
}: {
  categoryFilter: string
  showCategoryFilter: boolean
  subjectTypeFilters: Array<{ label: string; type: SubjectType }>
}) {
  return (
    subjectTypeFilters.length > 1 &&
    (!showCategoryFilter || categoryFilter === INDEX_RELATED_CATEGORY_LABELS[0])
  )
}

export function normalizeIndexRelatedCategoryFilter(filter: string | undefined, options: string[]) {
  return filter && options.includes(filter) ? filter : ALL_INDEX_RELATED_CATEGORIES
}

export function normalizeIndexRelatedSubjectTypeFilter(
  filter: string | undefined,
  options: string[],
) {
  return filter && options.includes(filter) ? filter : ALL_INDEX_RELATED_SUBJECT_TYPES
}

export function getIndexRelatedQueryFilters({
  categoryFilter,
  showCategoryFilter,
  subjectTypeFilter,
}: {
  categoryFilter: string
  showCategoryFilter: boolean
  subjectTypeFilter: string
}) {
  const type =
    subjectTypeFilter === ALL_INDEX_RELATED_SUBJECT_TYPES
      ? undefined
      : INDEX_RELATED_SUBJECT_TYPE_BY_LABEL.get(subjectTypeFilter)

  if (type !== undefined) {
    return { cat: 0 as IndexRelatedCategory, type }
  }

  if (!showCategoryFilter || categoryFilter === ALL_INDEX_RELATED_CATEGORIES) {
    return { cat: undefined, type: undefined }
  }

  return {
    cat: INDEX_RELATED_CATEGORY_BY_LABEL.get(categoryFilter),
    type: undefined,
  }
}
