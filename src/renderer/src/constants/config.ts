// 存储有关 api 的 CONFIG

import { getTimestamp } from '@renderer/lib/utils/date'

export const HOST_NAME = 'bgm.tv'

export const HOST = `https://${HOST_NAME}`

export const UA =
  'CottonCandyZ/bangumi-electron/0.0.1 (Electron) (https://github.com/CottonCandyZ/bangumi-electron)'

export const WEB_LOGIN = {
  FORM_URL: `/login`,
  CAPTCHA: `/signup/captcha?${getTimestamp()}`,
  POST_URL: `/FollowTheRabbit`,
  POST_CONTENT_TYPE: 'application/x-www-form-urlencoded',
}
