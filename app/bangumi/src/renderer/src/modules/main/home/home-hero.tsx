import type { Subject } from '@renderer/data/types/subject'
import type { SectionPath } from '@renderer/data/types/web'
import { CategoryHero } from '@renderer/modules/main/category/hero'
import { useTrendingSubjects } from '@renderer/modules/main/category/use-trending-subjects'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { userIdAtom } from '@renderer/state/session'
import { useAtomValue } from 'jotai'

/**
 * How many of each category's trending head the home hero takes. The category carousels
 * below start after these, so nothing shows twice.
 */
export const HOME_HERO_QUOTA = {
  anime: 3,
  game: 2,
  book: 1,
  music: 1,
  real: 1,
} as const satisfies Record<SectionPath, number>

/** A big carousel of the hottest subjects across every category, interleaved. */
export function HomeHero() {
  const userId = useAtomValue(userIdAtom)
  const lists = [
    useTrendingSubjects('anime', HOME_HERO_QUOTA.anime),
    useTrendingSubjects('game', HOME_HERO_QUOTA.game),
    useTrendingSubjects('book', HOME_HERO_QUOTA.book),
    useTrendingSubjects('music', HOME_HERO_QUOTA.music),
    useTrendingSubjects('real', HOME_HERO_QUOTA.real),
  ]

  // Lay out once every category has either settled its head or given up.
  const settled = lists.every((list) => list.heroSubjects !== undefined || list.failed)
  const heads = lists.map((list) => list.heroSubjects ?? [])
  const ranks = new Map<number, number>()
  const subjects: Subject[] = []
  // Round-robin so neighbouring slides come from different categories.
  for (let round = 0; heads.some((head) => round < head.length); round++) {
    for (const head of heads) {
      const subject = head[round]
      if (!subject || ranks.has(subject.id)) continue
      ranks.set(subject.id, round + 1)
      subjects.push(subject)
    }
  }

  return (
    <CategoryHero
      key={userId ?? 'guest'}
      name="条目"
      subjects={settled ? subjects : undefined}
      failed={lists.every((list) => list.failed)}
      error={lists.find((list) => list.error)?.error}
      onRetry={() => Promise.all(lists.map((list) => list.refetch()))}
      getBadge={(subject) => `${SUBJECT_TYPE_MAP[subject.type]}热门 #${ranks.get(subject.id) ?? 1}`}
      keepPreviousData
    />
  )
}
