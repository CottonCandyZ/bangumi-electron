import { AuthorizationHeader } from '@renderer/data/fetch/config/path'
import { getAccessToken } from '@renderer/data/fetch/session'
import { safeLogout } from '@renderer/data/hooks/session'
import { logger } from '@renderer/lib/logger'
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

async function appendAuthHeader(options: { headers?: HeadersInit }) {
  const token = await getAccessToken()
  if (!token) return
  options.headers = new Headers(options.headers)
  options.headers.append('Authorization', AuthorizationHeader(token.access_token))
}

/** ofetch api optional auth */
export const apiFetchWithOptionalAuth = ofetch.create({
  baseURL: API_HOST,
  credentials: 'omit',
  async onRequest({ options }) {
    await appendAuthHeader(options)
  },
})

/** ofetch api must auth */
export const apiFetchWithAuth = ofetch.create({
  baseURL: API_HOST,
  credentials: 'omit',
  async onRequest({ options }) {
    await appendAuthHeader(options)
  },
  async onResponseError({ response }) {
    // Handle 401 Unauthorized errors by logging out the user
    if (response.status === 401) {
      const token = await getAccessToken()
      const createTime = token?.create_time ? new Date(token.create_time) : null
      const expiresAt =
        token?.expires_in && createTime
          ? new Date(createTime.getTime() + token.expires_in * 1000)
          : null

      await logger.error('auth-fetch', 'API 401 Unauthorized', {
        status: response.status,
        url: response.url,
      })
      await logger.error('auth-fetch', 'Access token status', {
        has_token: !!token,
        user_id: token?.user_id ?? null,
        expires_in: token?.expires_in ?? null,
        create_time: createTime ? createTime.toISOString() : null,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
      })

      // Use the safeLogout function to handle the logout process
      // This ensures only one logout happens at a time and shows a toast notification
      await safeLogout({ showToast: true })
    }
    // The error will still be thrown to the caller after this hook
  },
})

/** ofetch next config */
export const nextFetch = ofetch.create({ baseURL: NEXT_API_HOST, credentials: 'include' })
