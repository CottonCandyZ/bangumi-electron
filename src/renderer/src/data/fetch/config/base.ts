import { AuthorizationHeader } from '@renderer/data/fetch/config/path'
import { getAccessToken } from '@renderer/data/fetch/session'
import { ofetch } from 'ofetch'

/** 主站域名 */
export const HOST_NAME = 'bgm.tv'

/** API 域名 */
export const API_NAME = 'api.bgm.tv'

/** Private API 域名  https://next.bgm.tv/p1/#/ */
export const NEXT_API_NAME = 'next.bgm.tv'

/** 主站 URL */
export const HOST = `https://${HOST_NAME}`

/** API URL */
export const API_HOST = `https://${API_NAME}`

export const NEXT_API_HOST = `https://${NEXT_API_NAME}`

/** 一些静态资源，现在主要是图片 */
export const ASSERT_HOST = `https://lain.bgm.tv`

/** 从 env 读 APP ID */
export const APP_ID = import.meta.env.VITE_APP_ID

/** 从 env 读 APP_SECRET */
export const APP_SECRET = import.meta.env.VITE_APP_SECRET

/** OAuth 的 Redirect 地址 */
export const URL_OAUTH_REDIRECT = `${HOST}/dev/app`

/** ofetch web config */
export const webFetch = ofetch.create({ baseURL: HOST })

/** ofetch api config  */
export const apiFetch = ofetch.create({ baseURL: API_HOST, credentials: 'omit' })

/** ofetch api withAuth */
export const apiFetchWithAuth = ofetch.create({
  baseURL: API_HOST,
  credentials: 'omit',
  async onRequest({ options }) {
    const token = await getAccessToken()
    console.log(token)
    if (!token) return
    options.headers = new Headers(options.headers)
    options.headers.append('Authorization', AuthorizationHeader(token.access_token))
  },
})

/** ofetch next config */
export const nextFetch = ofetch.create({ baseURL: NEXT_API_HOST, credentials: 'include' })
