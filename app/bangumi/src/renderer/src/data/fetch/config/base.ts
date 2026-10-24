import { AuthorizationHeader } from '@renderer/data/fetch/config/path'
import {
  getAccessToken,
  safeRecoverAccessTokenAfterUnauthorized,
  getSessionVersion,
  assertSessionCurrent,
} from '@renderer/data/fetch/session'
import {
  assertWebVerificationNotRequired,
  getWebVerificationEpoch,
  isCloudflareChallenge,
  markWebVerificationRequired,
  WebVerificationRequiredError,
} from '@renderer/data/fetch/config/web-access'
import { getWebVerificationUrl } from '@shared/web-verification'
import {
  getPendingWebVerification,
  getWebVerificationAttempt,
  requestWebVerification,
  waitForWebVerification,
} from './web-verification'
import {
  FetchError,
  ofetch,
  type FetchContext,
  type FetchOptions,
  type FetchResponse,
} from 'ofetch'

type JsonFetchOptions = FetchOptions<'json'>

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

type WebResponseContext = FetchContext & { response: FetchResponse<unknown> }

function createWebFetch(session = false) {
  const requests = new WeakMap<object, { epoch: number; attempt: number }>()
  const verificationUrl = (request: WebResponseContext['request']) =>
    getWebVerificationUrl(typeof request === 'string' ? request : request.url)
  const rejectChallenge = async ({ request, response, options }: WebResponseContext) => {
    if (!(await isCloudflareChallenge(response))) return
    markWebVerificationRequired(requests.get(options)?.epoch)
    throw new WebVerificationRequiredError(verificationUrl(request))
  }
  const fetcher = ofetch.create({
    baseURL: HOST,
    credentials: 'include',
    async onRequest({ request, options }) {
      options.signal?.throwIfAborted()
      const pending = getPendingWebVerification()
      if (pending) {
        try {
          await waitForWebVerification(pending, options.signal)
        } catch {
          options.signal?.throwIfAborted()
          throw new WebVerificationRequiredError(verificationUrl(request))
        }
      }
      if (!session) assertWebVerificationNotRequired(verificationUrl(request))
      requests.set(options, {
        epoch: getWebVerificationEpoch(),
        attempt: getWebVerificationAttempt(),
      })
    },
    async onResponse(context) {
      if (!(await isCloudflareChallenge(context.response))) return
      const { request, options } = context
      const previous = requests.get(options)!
      const url = verificationUrl(request)
      options.signal?.throwIfAborted()
      markWebVerificationRequired(previous.epoch)
      if (previous.epoch === getWebVerificationEpoch()) {
        // A late response after cancellation must not reopen the dismissed window.
        if (previous.attempt !== getWebVerificationAttempt() && !getPendingWebVerification())
          throw new WebVerificationRequiredError(url)
        try {
          await waitForWebVerification(requestWebVerification({ url }), options.signal)
        } catch {
          options.signal?.throwIfAborted()
          throw new WebVerificationRequiredError(url)
        }
      }
      options.signal?.throwIfAborted()
      // Retry only a confirmed challenge, once, preserving POST bodies and raw metadata.
      context.response = await fetcher.raw(request, { ...options, onResponse: rejectChallenge })
    },
  })
  return fetcher
}

/** All webpage reads and actions recover through the same verification window. */
export const webFetch = createWebFetch()

/** OAuth JSON endpoints must remain reachable while webpage verification is pending. */
export const oauthFetch = ofetch.create({ baseURL: HOST, credentials: 'include' })

/** Login must be able to recover independently of a previously blocked trends request. */
export const sessionFetch = createWebFetch(true)

/** ofetch api config  */
export const apiFetch = ofetch.create({ baseURL: API_HOST, credentials: 'omit' })

async function appendAuthHeader(options: { headers?: HeadersInit; signal?: AbortSignal | null }) {
  options.signal?.throwIfAborted()
  const token = await getAccessToken()
  options.signal?.throwIfAborted()
  if (!token) return
  options.headers = new Headers(options.headers)
  options.headers.set('Authorization', AuthorizationHeader(token.access_token))
}

async function handleUnauthorizedResponse() {
  if (!navigator.onLine) return false
  return safeRecoverAccessTokenAfterUnauthorized()
}

async function retryAfterTokenRecovery<T>(
  request: Parameters<typeof apiFetch>[0],
  options: JsonFetchOptions | undefined,
  fetcher: typeof apiFetch,
) {
  const version = getSessionVersion()
  try {
    const result = await fetcher<T>(request, options)
    assertSessionCurrent(version)
    return result
  } catch (error) {
    assertSessionCurrent(version)
    options?.signal?.throwIfAborted()
    if (!(error instanceof FetchError) || error.statusCode !== 401) {
      throw error
    }

    const recovered = await handleUnauthorizedResponse()
    assertSessionCurrent(version)
    options?.signal?.throwIfAborted()
    if (!recovered) {
      throw error
    }

    const result = await fetcher<T>(request, options)
    assertSessionCurrent(version)
    return result
  }
}

/** ofetch api optional auth */
const apiFetchWithOptionalAuthOnce = ofetch.create({
  baseURL: API_HOST,
  credentials: 'omit',
  async onRequest({ options }) {
    await appendAuthHeader(options)
  },
})

/** ofetch api must auth */
const apiFetchWithAuthOnce = ofetch.create({
  baseURL: API_HOST,
  credentials: 'omit',
  async onRequest({ options }) {
    await appendAuthHeader(options)
  },
})

export function apiFetchWithOptionalAuth<T>(
  request: Parameters<typeof apiFetch>[0],
  options?: JsonFetchOptions,
) {
  return retryAfterTokenRecovery<T>(request, options, apiFetchWithOptionalAuthOnce)
}

export function apiFetchWithAuth<T>(
  request: Parameters<typeof apiFetch>[0],
  options?: JsonFetchOptions,
) {
  return retryAfterTokenRecovery<T>(request, options, apiFetchWithAuthOnce)
}

/** ofetch next config */
export const nextFetch = ofetch.create({ baseURL: NEXT_API_HOST, credentials: 'include' })

const nextFetchWithOptionalAuthOnce = ofetch.create({
  baseURL: NEXT_API_HOST,
  credentials: 'include',
  async onRequest({ options }) {
    await appendAuthHeader(options)
  },
})

export function nextFetchWithOptionalAuth<T>(
  request: Parameters<typeof nextFetch>[0],
  options?: JsonFetchOptions,
) {
  return retryAfterTokenRecovery<T>(request, options, nextFetchWithOptionalAuthOnce)
}
