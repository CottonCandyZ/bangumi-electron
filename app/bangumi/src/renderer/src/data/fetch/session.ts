import { LOGIN, webFetch } from '@renderer/data/fetch/config/'
import { Token } from '@renderer/data/types/login'
import { client } from '@renderer/lib/client'
import { readAccessToken } from './db/user'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { createPromiseCache, createSingletonPromise } from '@renderer/lib/utils/promise'
import { safeLogout } from '@renderer/data/hooks/session'
import { logger } from '@renderer/lib/logger'
import { store } from '@renderer/state/utils'
import { userIdAtom } from '@renderer/state/session'

// 这里是用来验证相关 session 的地方，如果可能也会刷新 Session

/**
 * 直接用访问主页，看看是不是 guest 来验证 web 登陆，实际上也可以用 /login redirect
 */
export async function isWebLogin() {
  const data = (await webFetch('/', {
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
    json = (await webFetch(LOGIN.OAUTH_ACCESS_TOKEN_STATUS, {
      method: 'post',
      headers: {
        'Content-Type': LOGIN.POST_CONTENT_TYPE,
      },
      body: new URLSearchParams({
        access_token: token.access_token,
      }),
    })) as Token & { user_id: string }
  } catch (e) {
    await logger.error('auth-session', 'isAccessTokenValid failed', e)
    return false
  }
  return !!json.user_id
}

/**
 * 登出时清除相关内容
 */
export async function logout() {
  cleanAccessTokenCache()
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sid' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sec_id' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_cookietime' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_auth' })
  store.set(userIdAtom, null)
}

// token cache
let accessTokenCache: (Token & { create_time: Date }) | null = null

// Create a promise cache for token refresh operations
const tokenRefreshCache = createPromiseCache<string, Token & { create_time: Date }>()
const tokenRecoverSingleton = createSingletonPromise<boolean>()

const REFRESH_AHEAD_MS = 60 * 1000

function isTokenExpired(token: Token & { create_time: Date }, nowTime = Date.now()) {
  return token.expires_in * 1000 + token.create_time.getTime() <= nowTime + REFRESH_AHEAD_MS
}

/**
 * 刷新 token 并避免同时多次刷新同一个 token
 * 使用 token 的 refresh_token 作为缓存键，确保同一时间只有一个刷新操作
 */
export async function safeRefreshToken(token: Token): Promise<Token & { create_time: Date }> {
  // Use token's refresh_token as the cache key
  const cacheKey = token.refresh_token

  // Use the promise cache utility to get or create a refresh promise
  return tokenRefreshCache.getOrCreatePromise(cacheKey, async () => {
    const newToken = await refreshToken({
      ...token,
    })
    return { ...newToken, create_time: new Date() }
  })
}

/**
 * 在服务端返回 401 时，强制刷新 token（忽略本地 expires_in 判定）。
 * 返回 true 表示刷新成功，false 表示无法恢复登录态。
 */
export async function recoverAccessTokenAfterUnauthorized(
  userId: string | null = store.get(userIdAtom) ?? null,
) {
  if (!userId) return false
  const token = await readAccessToken({ user_id: Number(userId) })
  if (!token) {
    await logger.warn('auth-session', 'recover token skipped: no db token', {
      user_id: Number(userId),
    })
    return false
  }
  try {
    accessTokenCache = await safeRefreshToken(token)
    await logger.warn('auth-session', 'recover token success after 401', {
      user_id: accessTokenCache.user_id,
      expires_in: accessTokenCache.expires_in,
      create_time: accessTokenCache.create_time.toISOString(),
    })
    return true
  } catch (error) {
    await logger.error('auth-session', 'recover token failed after 401', error)
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
  const nowTime = Date.now()

  void logger.debug('auth-session', 'isExpired check', {
    isExpired:
      accessTokenCache &&
      accessTokenCache.expires_in * 1000 + accessTokenCache.create_time.getTime() < nowTime,
    user_id: Number(userId),
    cache_user_id: accessTokenCache?.user_id ?? null,
  })

  if (accessTokenCache?.user_id === Number(userId) && !isTokenExpired(accessTokenCache, nowTime)) {
    return accessTokenCache
  }
  const token = await readAccessToken({ user_id: Number(userId) })

  // 判断过期
  if (token && isTokenExpired(token, nowTime)) {
    // refresh token using the safe refresh function
    await logger.info('auth-session', 'start refreshing token', {
      user_id: token.user_id,
      create_time: token.create_time?.toISOString?.() ?? token.create_time,
      expires_in: token.expires_in,
    })
    try {
      accessTokenCache = await safeRefreshToken(token)
    } catch (e) {
      await logger.error('auth-session', 'refresh token failed, logging out', e)
      await safeLogout({ showToast: true })
      return null
    }
    return accessTokenCache
  }
  accessTokenCache = token ?? null
  return accessTokenCache
}

/** 清除 AccessToken 缓存 */
export function cleanAccessTokenCache() {
  accessTokenCache = null
  // Also clear any pending refresh token promises
  tokenRefreshCache.clearAllPromises()
  tokenRecoverSingleton.clear()
}
