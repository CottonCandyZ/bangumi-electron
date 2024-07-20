import { Pagination } from '@renderer/data/types/bgm'

export type Episodes = {
  data: Episode[]
} & Pagination

export type Episode = {
  airdate: string
  name: string
  name_cn: string
  duration: string
  desc: string
  ep: number
  sort: number
  id: number
  subject_id: number
  comment: number
  type: EpisodeType | 4 | 5 | 6
  disc: number
  duration_seconds: number
}

export enum EpisodeType {
  '本篇' = 0,
  'SP',
  'OP',
  'ED',
}
