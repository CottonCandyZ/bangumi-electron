// 存储有关 api 的 CONFIG
import { APP_ID, URL_OAUTH_REDIRECT } from './base'
import { CharacterId, PersonId, SubjectId } from '@renderer/data/types/bgm'
import { UserInfo } from '@renderer/data/types/user'
import { SectionPath } from '@renderer/data/types/web'
import { getTimestamp } from '@renderer/lib/utils/date'

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
  BY_USERNAME: (username: UserInfo['username']) => `/v0/users/${username}`,
}

/** Private API 用户 */
export const NEXT_USERS = {
  BY_USERNAME: (username: UserInfo['username']) => `/p1/users/${username}`,
  TIMELINE_BY_USERNAME: (username: UserInfo['username']) => `/p1/users/${username}/timeline`,
  GROUPS_BY_USERNAME: (username: UserInfo['username'], limit: number, offset: number) =>
    `/p1/users/${username}/groups?limit=${limit}&offset=${offset}`,
}

/** 条目相关 */
export const SUBJECTS = {
  BY_ID: (id: SubjectId) => `/v0/subjects/${id}`,
  CHARACTERS_BY_ID: (id: SubjectId) => `/v0/subjects/${id}/characters`,
  PERSONS_BY_ID: (id: SubjectId) => `/v0/subjects/${id}/persons`,
  RELATED_SUBJECT_BY_ID: (id: SubjectId) => `/v0/subjects/${id}/subjects`,
  /** web 排行榜  exp https://bgm.tv/anime/browser/?sort=trends */
  TRENDS: (sectionPath: SectionPath, page?: number) =>
    `/${sectionPath}/browser/?sort=trends${page && page > 1 ? `&page=${page}` : ''}`,
}

/** Private API 条目 */
export const NEXT_SUBJECTS = {
  /** p1 条目吐槽箱 */
  COMMENTS_BY_ID: (id: SubjectId) => `/p1/subjects/${id}/comments`,
}

export const HTML_SUBJECTS = {
  BY_ID: (id: SubjectId) => `/subject/${id}`,
}

/** 章节相关 */
export const EPISODES = {
  ROOT: `/v0/episodes`,
  BY_ID: (id: string) => `/v0/episodes/${id}`,
}

/** Private API 章节 */
export const NEXT_EPISODES = {
  /** p1 章节吐槽箱 */
  COMMENTS_BY_ID: (id: string) => `/p1/episodes/${id}/comments`,
}

/** 角色 */
export const CHARACTERS = {
  /** v0 角色详情 */
  BY_ID: (id: CharacterId) => `/v0/characters/${id}`,
  /** v0 角色出场作品 */
  SUBJECTS_BY_ID: (id: CharacterId) => `/v0/characters/${id}/subjects`,
  /** v0 角色关联人物 */
  PERSONS_BY_ID: (id: CharacterId) => `/v0/characters/${id}/persons`,
}

/** Private API 角色 */
export const NEXT_CHARACTERS = {
  /** p1 角色吐槽箱 */
  COMMENTS_BY_ID: (id: CharacterId) => `/p1/characters/${id}/comments`,
}

/** 人物 */
export const PERSONS = {
  /** v0 人物详情 */
  BY_ID: (id: PersonId) => `/v0/persons/${id}`,
  /** v0 人物参与作品 */
  SUBJECTS_BY_ID: (id: PersonId) => `/v0/persons/${id}/subjects`,
  /** v0 人物出场角色 */
  CHARACTERS_BY_ID: (id: PersonId) => `/v0/persons/${id}/characters`,
}

/** Private API 人物 */
export const NEXT_PERSONS = {
  /** p1 人物吐槽箱 */
  COMMENTS_BY_ID: (id: PersonId) => `/p1/persons/${id}/comments`,
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

  /** web 删除收藏 */
  DELETE_SUBJECT_BY_ID: (subjectId: SubjectId) => `/subject/${subjectId}/remove`,
}

/** Private API 测试 */
export const NEXT_COLLECTIONS = {
  LIST: (limit: number, offset: number) =>
    `/p1/collections/subjects?limit=${limit}&offset=${offset}`,
}

/** 搜索 */
export const SEARCH = {
  V0: (category: 'subjects' | 'characters' | 'persons' = 'subjects') => `/v0/search/${category}`,
  P1: (category: 'subjects' | 'characters' | 'persons' = 'subjects') => `/p1/search/${category}`,
}

/** Private API 社区 */
export const NEXT_COMMUNITY = {
  GROUPS: ({ sort, limit, offset }: { sort: string; limit: number; offset: number }) =>
    `/p1/groups?sort=${sort}&limit=${limit}&offset=${offset}`,
  GROUP_BY_NAME: (groupName: string) => `/p1/groups/${groupName}`,
  GROUP_MEMBERS: ({
    groupName,
    limit,
    offset,
  }: {
    groupName: string
    limit: number
    offset: number
  }) => `/p1/groups/${groupName}/members?limit=${limit}&offset=${offset}`,
  GROUP_TOPICS: ({
    groupName,
    limit,
    offset,
  }: {
    groupName: string
    limit: number
    offset: number
  }) => `/p1/groups/${groupName}/topics?limit=${limit}&offset=${offset}`,
  RECENT_GROUP_TOPICS: ({ mode, limit, offset }: { mode: string; limit: number; offset: number }) =>
    `/p1/groups/-/topics?mode=${mode}&limit=${limit}&offset=${offset}`,
  RECENT_SUBJECT_TOPICS: ({ limit, offset }: { limit: number; offset: number }) =>
    `/p1/subjects/-/topics?limit=${limit}&offset=${offset}`,
  SUBJECT_TOPICS: ({
    subjectId,
    limit,
    offset,
  }: {
    subjectId: SubjectId
    limit: number
    offset: number
  }) => `/p1/subjects/${subjectId}/topics?limit=${limit}&offset=${offset}`,
  TRENDING_SUBJECT_TOPICS: ({ limit, offset }: { limit: number; offset: number }) =>
    `/p1/trending/subjects/topics?limit=${limit}&offset=${offset}`,
}

/** Private API 每日放送 */
export const NEXT_CALENDAR = {
  ROOT: '/p1/calendar',
}

/** Private API 时间线 */
export const NEXT_TIMELINE = {
  ROOT: ({ mode, limit, until }: { mode?: string; limit?: number; until?: number }) => {
    const params = new URLSearchParams()
    if (mode) params.set('mode', mode)
    if (limit !== undefined) params.set('limit', limit.toString())
    if (until !== undefined) params.set('until', until.toString())
    const query = params.toString()
    return query ? `/p1/timeline?${query}` : '/p1/timeline'
  },
}
