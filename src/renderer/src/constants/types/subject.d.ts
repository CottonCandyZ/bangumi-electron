import { InfoBoxValueList, SubjectId } from '@renderer/constants/types/bgm'

/** 条目 */
export type Subject = {
  date: string
  platform: string
  images: CoverImages
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
  key: string | InfoKey
  value: string | InfoBoxValueList[]
}

export type InfoKey =
  | '中文名'
  | '放送星期'
  | '原作'
  | '别名'
  | '话数'
  | '放送开始'
  | '放送星期'
  | '官方网站'
  | '播放电视台'
  | '其他电视台'
  | 'Copyright'
  | '原作'
  | '导演'
  | '人物原案'
  | '人物设定'
  | 'OP・ED 分镜'

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
