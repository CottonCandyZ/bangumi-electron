/**
 * v0/me
 */

import { ModifyField } from '@shared/utils/type'

export type UserInfo = {
  avatar: string
  sign: string
  username: string
  nickname: string
  id: number
  user_group: number
  url: string
  time_offset: number
}

export type APIUserInfo = ModifyField<
  UserInfo,
  'avatar',
  {
    large: string
    medium: string
    small: string
  }
>

export enum UerGroup {
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

/** 登录信息 */
export type LoginInfo = {
  email: string
  password: string
}

/** token */
export type Token = {
  access_token: string
  refresh_token: string
  expires_in: number
}
