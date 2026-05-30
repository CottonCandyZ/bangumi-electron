import { Images, Pagination } from '@renderer/data/types/bgm'
import { CoverImages, RatingCount, SubjectType, Tag } from '@renderer/data/types/subject'

export type SearchDataPage = {
  data: SearchData[]
} & Pagination

export type SearchCategory = 'subjects' | 'characters' | 'persons'

export type SearchData = SearchSubjectData | SearchMonoData

export type SearchSubjectData = {
  id: number
  name: string
  name_cn: string
  type: SubjectType
  images: CoverImages
  image?: string
  summary: string
  date?: string
  platform?: string
  tags: Tag[]
  eps?: number
  volumes?: number
  total_episodes?: number
  meta_tags?: string[]
  series?: boolean
  rating: SearchSubjectRating
  locked: boolean
  nsfw: boolean
}

export type SearchMonoData = {
  id: number
  name: string
  type: number
  images?: Images | null
  image?: string
  summary?: string
  infobox?: unknown[]
  locked?: boolean
  nsfw?: boolean
  career?: string[]
}

export type SearchSubjectRating = {
  rank: number
  count: RatingCount
  score: number
  total: number
}

export type SearchParam = {
  keyword?: string
  category?: SearchCategory
  // https://github.com/bangumi/server/blob/5c576e267268c490a0b97686d0668ffc36bf1dd9/internal/search/handle.go#L172-L183
  sort?: 'match' | 'score' | 'heat' | 'rank'
  filter?: Filter
}
export type Filter = {
  type?: SubjectType[]
  tag?: string[]
  metaTag?: string[]
  airDate?: string[]
  rating?: string[]
  rank?: string[]
  nsfw?: boolean
}
