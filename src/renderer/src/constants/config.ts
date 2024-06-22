// 存储有关 api 的 CONFIG

import { getTimestamp } from '@renderer/lib/utils/date'
import { ofetch } from 'ofetch'

export const HOST_NAME = 'bgm.tv'

export const API_NAME = 'api.bgm.tv'

export const HOST = `https://${HOST_NAME}`

export const API_HOST = `https://${API_NAME}`

export const APP_ID = import.meta.env.VITE_APP_ID

export const APP_SECRET = import.meta.env.VITE_APP_SECRET

export const URL_OAUTH_REDIRECT = `${HOST}/dev/app`

export const AuthorizationHeader = (token: string) => `Bearer ${token}`

export const LOGIN = {
  FORM_URL: `/login`,
  CAPTCHA: `/signup/captcha?${getTimestamp()}`,
  POST_URL: `/FollowTheRabbit`,
  POST_CONTENT_TYPE: 'application/x-www-form-urlencoded',
  OAUTH_FORM_ULR: `/oauth/authorize?client_id=${APP_ID}&response_type=code&redirect_uri=${URL_OAUTH_REDIRECT}`,
  OAUTH_ACCESS_TOKEN_URL: `/oauth/access_token`,
  OAUTH_ACCESS_TOKEN_STATUS: `/oauth/token_status`,
}

export const USER = {
  ME: '/v0/me',
}

export const SUBJECTS = {
  BY_ID: (id: string) => `/v2/subject/${id}`,
}

export const webFetch = ofetch.create({ baseURL: HOST })

export const apiFetch = ofetch.create({ baseURL: API_HOST })
