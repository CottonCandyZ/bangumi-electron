import { SubjectId } from '@renderer/constants/types'

/** 条目 */
export type Subject = {
  date: string
  platform: string
  images: CoverImages[]
  summary: string
  name: string
  name_cn: string
  tags: Tag[]
  infobox: InfoBox[]
  rating: Rating
  total_episodes: number
  collection: Collection
  id: SubjectId
  eps: number
  volumes: number
  series: boolean
  locked: boolean
  nsfw: boolean
  type: number
}

export type CoverImages = {
  /** 200 */
  small: string
  /** 100 */
  grid: string
  /** Original */
  large: string
  /** 800 */
  medium: string
  /** 400 */
  common: string
}

export type Tag = {
  name: string
  count: number
}

export type InfoBox = {
  key: string
  value: string | InfoBoxValueList[]
}

export type InfoBoxValueList = {
  v: string
}

// export interface

export type Rating = {
  rank: number
  total: number
  count: RatingCount
  score: number
}

export type RatingCount = {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
  '6': number
  '7': number
  '8': number
  '9': number
  '10': number
}

export type Collection = {
  on_hold: number
  dropped: number
  wish: number
  collect: number
  doing: number
}
