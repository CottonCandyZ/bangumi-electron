import { Images, PersonCareer } from '@renderer/constants/types/bgm'

export type PersonGrid = {
  images: Images | null
  name: string
  relation: string
  career: PersonCareer[]
  id: PersonId
  type: PersonType
}

export type PersonType = 1 | 2 | 3
