import { CharacterId, Images, PersonCareer } from '@renderer/data/types/bgm'
import { InfoBoxValueList } from '@renderer/data/types/subject'

export type Character = {
  images: Images
  name: string
  relation: string
  actors: Actor[]
  type: number
  id: CharacterId
}

export interface CharacterDetail {
  birth_mon: number | null
  gender: string
  birth_day: number | null
  birth_year: number | null
  blood_type: BloodType | null
  images: Images
  summary: string
  name: string
  infobox: InfoBox
  stat: Stat
  id: CharacterId
  locked: boolean
  type: number
  nsfw: boolean
}

export type BloodType = 1 | 2 | 3 | 4

export type InfoBox = {
  key: string
  value: string | InfoBoxValueList[]
}

export interface Stat {
  comments: number
  collects: number
}

export type Actor = {
  images: Images
  name: string
  short_summary: string
  career: PersonCareer[]
  id: number
  type: number
  locked: boolean
}
