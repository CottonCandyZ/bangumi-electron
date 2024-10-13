/** 登录信息 */
export type LoginInfo = {
  email: string
  password: string
  id: number
}

/** token */
export type Token = {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: number
}
