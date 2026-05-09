import {
  BloodType,
  Images,
  InfoBoxValueList,
  PersonCareer,
  PersonId,
  Stat,
} from '@renderer/data/types/bgm'
import { SubjectType } from '@renderer/data/types/subject'

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
  images: Images | null
  summary: string
  name: string
  img?: string
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

/** v0 人物参与作品 */
export type PersonRelatedSubject = {
  id: number
  type: SubjectType
  staff: string
  eps: string
  name: string
  name_cn: string
  image?: string
}

/** v0 人物出场角色 */
export type PersonRelatedCharacter = {
  id: number
  name: string
  type: number
  images?: Images | null
  subject_id: number
  subject_type: SubjectType
  subject_name: string
  subject_name_cn: string
  staff?: string
}

/** private p1 评论用户 */
export type PersonCommentUser = {
  id: number
  username: string
  nickname: string
  avatar: {
    small: string
    medium: string
    large: string
  }
}

/** private p1 人物吐槽箱单条评论基础结构 */
export type PersonCommentBase = {
  id: number
  mainID: number
  creatorID: number
  relatedID: number
  relatedPhotoID?: number
  createdAt: number
  content: string
  state: number
  user?: PersonCommentUser
}

/** private p1 人物吐槽箱评论，包含楼中楼回复 */
export type PersonComment = PersonCommentBase & {
  replies: PersonCommentBase[]
}
