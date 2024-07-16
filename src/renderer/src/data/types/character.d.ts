import { BloodType, Images, PersonCareer, Stat } from '@renderer/data/types/bgm'
import { InfoBoxValueList } from '@renderer/data/types/subject'

export type Character = {
  images: Images
  name: string
  relation: string
  actors: Actor[]
  type: number
  id: number
}

export interface CharacterDetail {
  gender: string
  birth_mon: number | null
  birth_day: number | null
  birth_year: number | null
  blood_type: BloodType | null
  images: Images
  summary: string
  name: string
  infobox: InfoBox
  stat: Stat
  id: number
  locked: boolean
  type: number
  nsfw: boolean
}

export type InfoBox = {
  key: string
  value: string | InfoBoxValueList[]
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
