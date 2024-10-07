// 存储有关 api 的 CONFIG

import { CharacterId, PersonId, SubjectId } from '@renderer/data/types/bgm'
import { UserInfo } from '@renderer/data/types/user'
import { SectionPath } from '@renderer/data/types/web'
import { getTimestamp } from '@renderer/lib/utils/date'
import { ofetch } from 'ofetch'

/** 主站域名 */
export const HOST_NAME = 'bgm.tv'

/** API 域名 */
export const API_NAME = 'api.bgm.tv'

/** 主站 URL */
export const HOST = `https://${HOST_NAME}`

/** API URL */
export const API_HOST = `https://${API_NAME}`

/** 一些静态资源，现在主要是图片 */
export const ASSERT_HOST = `https://lain.bgm.tv`

/** 从 env 读 APP ID */
export const APP_ID = import.meta.env.VITE_APP_ID

/** 从 env 读 APP_SECRET */
export const APP_SECRET = import.meta.env.VITE_APP_SECRET

/** OAuth 的 Redirect 地址 */
export const URL_OAUTH_REDIRECT = `${HOST}/dev/app`

/** 构建 Author 头 */
export const AuthorizationHeader = (token: string) => `Bearer ${token}`

/** 登录相关 */
export const LOGIN = {
  FORM_URL: `/login`,
  CAPTCHA: `/signup/captcha?${getTimestamp()}`,
  POST_URL: `/FollowTheRabbit`,
  POST_CONTENT_TYPE: 'application/x-www-form-urlencoded',
  OAUTH_FORM_ULR: `/oauth/authorize?client_id=${APP_ID}&response_type=code&redirect_uri=${URL_OAUTH_REDIRECT}`,
  OAUTH_ACCESS_TOKEN_URL: `/oauth/access_token`,
  OAUTH_ACCESS_TOKEN_STATUS: `/oauth/token_status`,
}

/** 用户相关 */
export const USER = {
  ME: '/v0/me',
}

/** 条目相关 */
export const SUBJECTS = {
  BY_ID: (id: SubjectId) => `/v0/subjects/${id}`,
  CHARACTERS_BY_ID: (id: SubjectId) => `/v0/subjects/${id}/characters`,
  PERSONS_BY_ID: (id: SubjectId) => `/v0/subjects/${id}/persons`,
  RELATED_SUBJECT_BY_ID: (id: SubjectId) => `/v0/subjects/${id}/subjects`,
  TRENDS: (sectionPath: SectionPath) => `/${sectionPath}/browser/?sort=trends`,
}

export const HTML_SUBJECTS = {
  BY_ID: (id: SubjectId) => `/subject/${id}`,
}

/** 章节相关 */
export const EPISODES = {
  ROOT: `/v0/episodes`,
}

/** 角色 */
export const CHARACTERS = {
  BY_ID: (id: CharacterId) => `/v0/characters/${id}`,
}

/** 人物 */
export const PERSONS = {
  BY_ID: (id: PersonId) => `/v0/persons/${id}`,
}

/** 收藏 */
export const COLLECTIONS = {
  BY_USERNAME: (username: UserInfo['username']) => `/v0/users/${username}/collections`,
  BY_USERNAME_AND_SUBJECT_ID: (username: UserInfo['username'], subjectId: SubjectId) =>
    `/v0/users/${username}/collections/${subjectId}`,
  EPISODES_BY_SUBJECT_ID: (subjectId: SubjectId) => `/v0/users/-/collections/${subjectId}/episodes`,
  ADD_OR_MODIFY_SUBJECT_BY_ID: (subjectId: SubjectId) => `/v0/users/-/collections/${subjectId}`,
  MODIFY_EPISODE_BY_SUBJECT_ID: (subjectId: SubjectId) =>
    `/v0/users/-/collections/${subjectId}/episodes`,
}

export const HTML_COLLECTION = {
  DELETE_SUBJECT_BY_ID: (subjectId: SubjectId) => `/subject/${subjectId}/remove`,
}

/** 搜索 */

export const SEARCH = {
  V0: '/v0/search/subjects',
}

/** ofetch web config */
export const webFetch = ofetch.create({ baseURL: HOST })

/** ofetch api config  */
export const apiFetch = ofetch.create({ baseURL: API_HOST })
