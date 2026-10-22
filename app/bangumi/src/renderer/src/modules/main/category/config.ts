import type { SearchParam } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import type { SectionPath } from '@renderer/data/types/web'
import dayjs from 'dayjs'

export type CategoryConfig = {
  sectionPath: SectionPath
  name: string
  /** 近期新作区块的标题 */
  recentTitle: string
  /** 近期新作的时间窗口（月） */
  recentMonths: number
  tags: string[]
}

export const CATEGORY_CONFIG = {
  anime: {
    sectionPath: 'anime',
    name: '动画',
    recentTitle: '近期新番',
    recentMonths: 4,
    tags: [
      '原创',
      '漫画改',
      '轻小说改',
      '游戏改',
      '恋爱',
      '日常',
      '治愈',
      '百合',
      '科幻',
      '奇幻',
      '战斗',
      '悬疑',
      '运动',
      '剧场版',
    ],
  },
  game: {
    sectionPath: 'game',
    name: '游戏',
    recentTitle: '近期新作',
    recentMonths: 6,
    tags: [
      'RPG',
      'ACT',
      'AVG',
      '视觉小说',
      'SLG',
      '独立游戏',
      '开放世界',
      'Roguelike',
      '解谜',
      '音乐游戏',
      '恋爱',
      'Switch',
      'PS5',
      'PC',
    ],
  },
  book: {
    sectionPath: 'book',
    name: '书',
    recentTitle: '近期新书',
    recentMonths: 6,
    tags: [
      '漫画',
      '轻小说',
      '小说',
      '百合',
      '恋爱',
      '校园',
      '奇幻',
      '科幻',
      '推理',
      '历史',
      '治愈',
      '画集',
      '设定集',
      '短篇',
    ],
  },
  music: {
    sectionPath: 'music',
    name: '音乐',
    recentTitle: '近期新碟',
    recentMonths: 6,
    tags: [
      'OST',
      'Anisong',
      'J-POP',
      '角色歌',
      '同人',
      'VOCALOID',
      '游戏音乐',
      '摇滚',
      '电子',
      '古典',
      '爵士',
      'Live',
      '单曲',
      '专辑',
    ],
  },
  real: {
    sectionPath: 'real',
    name: '三次元',
    recentTitle: '近期新剧',
    recentMonths: 6,
    tags: [
      '日剧',
      '美剧',
      '英剧',
      '韩剧',
      '国产剧',
      '电影',
      '纪录片',
      '特摄',
      '综艺',
      '喜剧',
      '悬疑',
      '科幻',
      '爱情',
      '动作',
    ],
  },
} satisfies Record<SectionPath, CategoryConfig>

/** 搜索 API 的日期窗口，含今天。 */
export function recentAirDateFilter(months: number) {
  const today = dayjs()
  return [
    `>=${today.subtract(months, 'month').format('YYYY-MM-DD')}`,
    `<=${today.format('YYYY-MM-DD')}`,
  ]
}

export function yearAirDateFilter(year: number) {
  return [`>=${year}-01-01`, `<${year + 1}-01-01`]
}

export function subjectTypeFilter(sectionPath: SectionPath) {
  return [SubjectType[sectionPath]]
}

/** 与 `useSearchParams` 读取的 URL 参数保持一致，方便跳到完整搜索页。 */
export function searchPageHref(searchParam: SearchParam) {
  const params = new URLSearchParams()
  if (searchParam.sort) params.set('sort', searchParam.sort)
  for (const type of searchParam.filter?.type ?? []) params.append('type', String(type))
  for (const tag of searchParam.filter?.tag ?? []) params.append('tag', tag)
  for (const airDate of searchParam.filter?.airDate ?? []) params.append('air_date', airDate)
  for (const rank of searchParam.filter?.rank ?? []) params.append('rank', rank)
  return `/search?${params.toString()}`
}
