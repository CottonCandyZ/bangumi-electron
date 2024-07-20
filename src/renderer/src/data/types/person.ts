import { BloodType, Images, InfoBoxValueList, PersonCareer, Stat } from '@renderer/data/types/bgm'

export type PersonGrid = {
  images: Images | null
  name: string
  relation: string
  career: PersonCareer[]
  id: PersonId
  type: PersonType
}

export type Person = {
  last_modified: string
  birth_mon: number | null
  birth_day: number | null
  birth_year: number | null
  blood_type: BloodType | null
  gender: string
  images: Images
  summary: string
  name: string
  img: string
  infobox: Infobox[]
  career: string[]
  stat: Stat
  id: number
  locked: boolean
  type: PersonType
}

export type PersonType = 1 | 2 | 3

export type Infobox = {
  key: string | InfoKey
  value: string | InfoBoxValueList[]
}

export type InfoKey = '简体中文名' | '别名'
