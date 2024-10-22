import { ModifyField } from '@shared/utils/type'

/**
 * v0/me
 */
export type UserInfo = {
  avatar: string
  sign: string
  username: string
  nickname: string
  id: number
  user_group: UserGroup
  url: string
  time_offset: number
}

export type UserInfoAPI = ModifyField<
  UserInfo,
  'avatar',
  { large: string; medium: string; small: string }
>

export enum UserGroup {
  '管理员' = 1,
  'Bangumi 管理猿',
  '天窗管理员',
  '禁言用户',
  '禁止访问用户',
  '人物管理猿' = 8,
  '维基条目管理猿',
  '用户',
  '维基人',
}
