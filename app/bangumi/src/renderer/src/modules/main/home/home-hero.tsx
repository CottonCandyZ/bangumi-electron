import type { Subject } from '@renderer/data/types/subject'
import type { SectionPath } from '@renderer/data/types/web'
import { CategoryHero } from '@renderer/modules/main/category/hero'
import { useTrendingSubjects } from '@renderer/modules/main/category/use-trending-subjects'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { useMemo } from 'react'

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

const SECTIONS = Object.keys(HOME_HERO_QUOTA) as (keyof typeof HOME_HERO_QUOTA)[]

/** A big carousel of the hottest subjects across every category, interleaved. */
export function HomeHero() {
  const anime = useTrendingSubjects('anime', HOME_HERO_QUOTA.anime)
  const game = useTrendingSubjects('game', HOME_HERO_QUOTA.game)
  const book = useTrendingSubjects('book', HOME_HERO_QUOTA.book)
  const music = useTrendingSubjects('music', HOME_HERO_QUOTA.music)
  const real = useTrendingSubjects('real', HOME_HERO_QUOTA.real)
  const trending = { anime, game, book, music, real }
  const lists = SECTIONS.map((section) => trending[section])

  // Lay out once every category has either settled its head or given up.
  const settled = lists.every((list) => list.heroSubjects !== undefined || list.failed)
  const heads = lists.map((list) => list.heroSubjects ?? [])
  const key = heads.map((head) => head.map((subject) => subject.id).join(',')).join('|')

  const { subjects, ranks } = useMemo(() => {
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
    return { subjects, ranks }
    // `key` captures the heads' content; the arrays themselves are rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <CategoryHero
      name="条目"
      subjects={settled ? subjects : undefined}
      failed={lists.every((list) => list.failed)}
      error={lists.find((list) => list.error)?.error}
      onRetry={() => Promise.all(lists.map((list) => list.refetch()))}
      getBadge={(subject) => `${SUBJECT_TYPE_MAP[subject.type]}热门 #${ranks.get(subject.id) ?? 1}`}
    />
  )
}
