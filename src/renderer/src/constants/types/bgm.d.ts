// Ref && Thanks!
// https://github.com/czy0729/Bangumi/blob/master/src/types/bangumi.ts

/** 任意 ID */
export type Id = number | string

/** 条目 ID */
export type SubjectId = number | string

/** 角色 */
export type CharacterId = number | string

/** 人物 */
export type PersonId = number | string

/** 章节 ID */
export type EpId = number | string

/** 用户 ID */
export type UserId = number | string

/** infoBox 内部 list */
export type InfoBoxValueList = {
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
