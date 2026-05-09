import {
  BloodType,
  Images,
  InfoBoxValueList,
  PersonCareer,
  PersonId,
  Stat,
} from '@renderer/data/types/bgm'
import { SubjectType } from '@renderer/data/types/subject'

export type Character = {
  images: Images
  name: string
  relation: string
  actors: Actor[]
  type: number
  id: number
}

export type CharacterDetail = {
  gender: string | null
  birth_mon: number | null
  birth_day: number | null
  birth_year: number | null
  blood_type: BloodType | null
  images: Images | null
  summary: string
  name: string
  infobox: InfoBox[]
  stat: Stat
  id: number
  locked: boolean
  type: number
  nsfw: boolean
}

export enum CharacterType {
  '角色' = 1,
  '机体',
  '舰船',
  '组织',
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

/** v0 角色出场作品 */
export type CharacterRelatedSubject = {
  id: number
  type: SubjectType
  staff: string
  eps?: string
  name: string
  name_cn: string
  image?: string
}

/** v0 角色关联人物 */
export type CharacterRelatedPerson = {
  images?: Images | null
  name: string
  subject_name: string
  subject_name_cn: string
  subject_type: SubjectType
  subject_id: number
  staff: string
  id: PersonId
  type: number
}
