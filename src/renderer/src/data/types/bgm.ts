// Ref && Thanks!
// https://github.com/czy0729/Bangumi/blob/master/src/types/bangumi.ts

/** 任意 ID */
export type Id = number | string

/** 条目 ID */
export type SubjectId = Id

/** 角色 */
export type CharacterId = Id

/** 人物 */
export type PersonId = Id

/** 章节 ID */
export type EpId = Id

/** 用户 ID */
export type UserId = Id

/** infoBox 内部 list */
export type InfoBoxValueList = {
  k?: string
  v: string
}

export type Images = {
  small: string
  grid: string
  large: string
  medium: string
}

export type PersonCareer =
  | 'producer'
  | 'mangaka'
  | 'artist'
  | 'seiyu'
  | 'writer'
  | 'illustrator'
  | 'actor'

export enum BloodType {
  A = 1,
  B,
  AB,
  O,
}

export type Stat = {
  comments: number
  collects: number
}

export type Pagination = {
  total: number
  limit: number
  offset: number
}

export type OnAirStatus = 'noAired' | 'onAir' | 'aired'

export type APIError = {
  title: string
  description: string
  detail?: string
}
