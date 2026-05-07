import { InfoBoxValueList } from '@renderer/data/types/bgm'
import { ModifyField } from '@shared/utils/type'

/** 条目 */
export type Subject = {
  id: number
  date: Date | null
  platform: string
  images: CoverImages
  summary: string
  name: string
  name_cn: string
  infobox: InfoBox[]
  ratingCount: RatingCount
  tags: Tag[]
  rating: Rating
  total_episodes: number
  collection: SubjectCollection
  /** eps 不可信 */
  eps: number
  volumes: number
  series: boolean
  locked: boolean
  nsfw: boolean
  type: SubjectType
  last_update_at: Date
}

export type SubjectAPI = ModifyField<
  Subject,
  'date' | 'ratingCount' | 'rating' | 'last_update_at',
  {
    date: string
    rating: Rating & {
      count: RatingCount
    }
  }
>

export type RelatedSubject = {
  images: CoverImages
  name: string
  name_cn: string
  relation: string
  type: number
  id: number
}

export type SlimSubject = Pick<
  Subject,
  'date' | 'images' | 'name' | 'name_cn' | 'tags' | 'type' | 'id' | 'eps' | 'volumes'
> & {
  score: number
  rank: number
  collection_total: number
}

export enum SubjectType {
  'book' = 1,
  'anime',
  'music',
  'game',
  'real' = 6,
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
  score: number
}

export type RatingCount = Record<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10', number>

export type SubjectCollection = {
  on_hold: number
  dropped: number
  wish: number
  collect: number
  doing: number
}

export type InfoBoxWeb = Map<string, InfoBoxWebValue[]>

export type InfoBoxWebValue = string | InfoBoxWebValueLinkItem

export type InfoBoxWebValueLinkItem = {
  name: string
  id: string
}
