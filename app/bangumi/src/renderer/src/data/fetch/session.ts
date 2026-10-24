import { FetchError } from 'ofetch'
import { LOGIN, oauthFetch, sessionFetch } from '@renderer/data/fetch/config/'
import { Token } from '@renderer/data/types/login'
import { client } from '@renderer/lib/client'
import { readAccessToken } from './db/user'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { createPromiseCache, createSingletonPromise } from '@renderer/lib/utils/promise'
import { store } from '@renderer/state/utils'
import { authRequiredUserIdAtom, userIdAtom } from '@renderer/state/session'
import { AuthError } from '@renderer/lib/utils/error'
import { isRequestCancelledError } from '@renderer/lib/utils/network'

let sessionVersion = 0

export function getSessionVersion() {
  return sessionVersion
}

export function assertSessionCurrent(version: number) {
  if (version !== sessionVersion) throw new DOMException('Session changed', 'AbortError')
}

// 这里是用来验证相关 session 的地方，如果可能也会刷新 Session

/**
 * 直接用访问主页，看看是不是 guest 来验证 web 登陆，实际上也可以用 /login redirect
 */
export async function isWebLogin() {
  const data = (await sessionFetch('/', {
    credentials: 'include',
    parseResponse: (text) => text,
  })) as string
  return !data.includes('<div class="guest">')
}

/**
 * 验证 AccessToken 有效性
 */
export async function isAccessTokenValid(token: Token) {
  let json: Token & { user_id: string }
  try {
    json = (await oauthFetch(LOGIN.OAUTH_ACCESS_TOKEN_STATUS, {
      method: 'post',
      headers: {
        'Content-Type': LOGIN.POST_CONTENT_TYPE,
      },
      body: new URLSearchParams({
        access_token: token.access_token,
      }),
    })) as Token & { user_id: string }
  } catch {
    return false
  }
  return !!json.user_id
}

/**
 * 登出时清除相关内容
 */
export async function logout() {
  store.set(userIdAtom, null)
  store.set(authRequiredUserIdAtom, null)
  cleanAccessTokenCache()
  await client.collectionActivate({ userId: null })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sid' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sec_id' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_cookietime' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_auth' })
}

// token cache
let accessTokenCache: (Token & { create_time: Date }) | null = null

// Create a promise cache for token refresh operations
const tokenRefreshCache = createPromiseCache<string, Token & { create_time: Date }>()
const tokenRecoverSingleton = createSingletonPromise<boolean>()

// Subscribe after cache initialization: mounting the storage atom may restore an account now.
store.sub(userIdAtom, () => cleanAccessTokenCache())

const REFRESH_AHEAD_MS = 60 * 1000

const clientErrors = new Set([
  'invalid_client',
  'unauthorized_client',
  'unsupported_grant_type',
  'invalid_scope',
])

/** Only reject a session after an OAuth response confirms that its credentials are invalid. */
async function isRefreshTokenRejected(error: unknown, token: Token) {
  if (!(error instanceof FetchError) || error.statusCode !== 400) return false
  const data = error.data
  if (!data || typeof data !== 'object') return false
  const code = typeof data.error === 'string' ? data.error.trim().toLowerCase() : ''
  if (clientErrors.has(code)) return false
  if (code === 'invalid_grant' || code === 'invalid_refresh_token') return true
  const description = typeof data.error_description === 'string' ? data.error_description : ''
  if (/client[_\s-]*(?:id|secret)|redirect[_\s-]*uri|grant[_\s-]*type/i.test(description))
    return false
  if (
    /refresh[_\s-]*token/i.test(description) &&
    /invalid|expired|revoked|not found/i.test(description)
  )
    return true
  // Legacy error shapes are ambiguous. Check this access token before ending the session.
  try {
    await oauthFetch(LOGIN.OAUTH_ACCESS_TOKEN_STATUS, {
      method: 'post',
      body: new URLSearchParams({ access_token: token.access_token }),
      retry: 0,
      timeout: 10000,
    })
    return false
  } catch (statusError) {
    return (
      statusError instanceof FetchError &&
      (statusError.statusCode === 400 || statusError.statusCode === 401) &&
      statusError.data !== null &&
      typeof statusError.data === 'object' &&
      !clientErrors.has(statusError.data.error)
    )
  }
}

function isTokenExpired(token: Token & { create_time: Date }, nowTime = Date.now()) {
  return token.expires_in * 1000 + token.create_time.getTime() <= nowTime + REFRESH_AHEAD_MS
}

/**
 * 刷新 token 并避免同时多次刷新同一个 token
 * 使用 token 的 refresh_token 作为缓存键，确保同一时间只有一个刷新操作
 */
export async function safeRefreshToken(token: Token): Promise<Token & { create_time: Date }> {
  // Use token's refresh_token as the cache key
  const cacheKey = `${token.user_id}:${token.refresh_token}`
  const version = sessionVersion

  // Use the promise cache utility to get or create a refresh promise
  return tokenRefreshCache.getOrCreatePromise(cacheKey, async () => {
    try {
      const newToken = await refreshToken({
        ...token,
        beforeSave: () => assertSessionCurrent(version),
      })
      assertSessionCurrent(version)
      if (store.get(authRequiredUserIdAtom) === String(token.user_id)) {
        store.set(authRequiredUserIdAtom, null)
      }
      return { ...newToken, create_time: new Date() }
    } catch (error) {
      assertSessionCurrent(version)
      if (
        navigator.onLine &&
        store.get(userIdAtom) === String(token.user_id) &&
        (await isRefreshTokenRejected(error, token))
      ) {
        assertSessionCurrent(version)
        // Another window may already have renewed/replaced this token while it was in flight.
        const latest = await readAccessToken({ user_id: token.user_id })
        assertSessionCurrent(version)
        if (latest && latest.refresh_token !== token.refresh_token) {
          if (isTokenExpired(latest)) return await safeRefreshToken(latest)
          store.set(authRequiredUserIdAtom, null)
          return latest
        }
        if (!navigator.onLine || store.get(userIdAtom) !== String(token.user_id)) throw error
        store.set(authRequiredUserIdAtom, String(token.user_id))
        throw AuthError.expire()
      }
      throw error
    }
  })
}

/**
 * 在服务端返回 401 时，强制刷新 token（忽略本地 expires_in 判定）。
 * 返回 true 表示刷新成功；确认过期时抛出 AuthError，临时恢复失败返回 false。
 */
export async function recoverAccessTokenAfterUnauthorized(
  userId: string | null = store.get(userIdAtom) ?? null,
) {
  if (!userId) return false
  const version = sessionVersion
  const token = await readAccessToken({ user_id: Number(userId) })
  assertSessionCurrent(version)
  if (!token) {
    return false
  }
  try {
    const recovered = await safeRefreshToken(token)
    assertSessionCurrent(version)
    accessTokenCache = recovered
    return true
  } catch (error) {
    if (error instanceof AuthError || isRequestCancelledError(error)) throw error
    return false
  }
}

/**
 * 避免多个 401 同时触发多次刷新
 */
export async function safeRecoverAccessTokenAfterUnauthorized(
  userId: string | null = store.get(userIdAtom) ?? null,
) {
  return await tokenRecoverSingleton.runOrAwait(async () => {
    return await recoverAccessTokenAfterUnauthorized(userId)
  })
}

/** 获得当前的 AccessToken，没登录时返回 null */
export async function getAccessToken(userId: string | null = store.get(userIdAtom) ?? null) {
  if (!userId) return null
  if (navigator.onLine && store.get(authRequiredUserIdAtom) === userId) throw AuthError.expire()
  const version = sessionVersion
  const nowTime = Date.now()

  if (accessTokenCache?.user_id === Number(userId) && !isTokenExpired(accessTokenCache, nowTime)) {
    return accessTokenCache
  }
  const token = await readAccessToken({ user_id: Number(userId) })
  assertSessionCurrent(version)

  // 判断过期
  if (token && isTokenExpired(token, nowTime)) {
    // Propagate refresh failure to the caller; requests never open login UI.
    const refreshed = await safeRefreshToken(token)
    assertSessionCurrent(version)
    accessTokenCache = refreshed
    return refreshed
  }
  accessTokenCache = token ?? null
  return accessTokenCache
}

/** 清除 AccessToken 缓存 */
export function cleanAccessTokenCache() {
  sessionVersion++
  accessTokenCache = null
  // Also clear any pending refresh token promises
  tokenRefreshCache.clearAllPromises()
  tokenRecoverSingleton.clear()
}

/** Only a server-confirmed rejection can end the active online session. */
export async function expireInvalidSession() {
  const userId = store.get(userIdAtom)
  if (!navigator.onLine || !userId || store.get(authRequiredUserIdAtom) !== userId) return false
  await logout()
  return true
}
