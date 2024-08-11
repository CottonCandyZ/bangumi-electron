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
  sort?: 'rank'
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
