export type Episodes = {
  data: Episode[]
  total: number
  limit: number
  offset: number
}

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
  type: 0 | 1 | 2 | 3 | 4 | 5 | 6
  disc: number
  duration_seconds: number
}
