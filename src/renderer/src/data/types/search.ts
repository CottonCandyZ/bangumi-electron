import { Pagination } from '@renderer/data/types/bgm'
import { SubjectType, Tag } from '@renderer/data/types/subject'

export type SearchDataPage = {
  data: SearchData[]
} & Pagination

export type SearchData = {
  date: string
  image: string
  type: SubjectType
  summary: string
  name: string
  name_cn: string
  tags: Tag[]
  score: number
  id: number
  rank: number
  nsfw: boolean
}

export type SearchParam = {
  keyword?: string
  // https://github.com/bangumi/server/blob/5c576e267268c490a0b97686d0668ffc36bf1dd9/internal/search/handle.go#L172-L183
  sort?: 'match' | 'score' | 'heat' | 'rank'
  filter?: Filter
}
export type Filter = {
  type?: SubjectType[]
  tag?: string[]
  airDate?: string[]
  rating?: string[]
  rank?: string[]
  nsfw?: boolean
}
