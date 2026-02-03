import { LOGIN, webFetch } from '@renderer/data/fetch/config/'
import { Token } from '@renderer/data/types/login'
import { client } from '@renderer/lib/client'
import { readAccessToken } from './db/user'
import { refreshToken } from '@renderer/data/fetch/web/login'
import { createPromiseCache } from '@renderer/lib/utils/promise'
import { safeLogout } from '@renderer/data/hooks/session'
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
    console.error(e)
    return false
  }
  return !!json.user_id
}

/**
 * 登出时清除相关内容
 */
export async function logout() {
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

/** 获得当前的 AccessToken，没登录时返回 null */
export async function getAccessToken(userId: string | null = store.get(userIdAtom) ?? null) {
  if (!userId) return null
  // 从缓存中读取，如果未过期，直接返回

  console.log(
    'isExpired check:',
    accessTokenCache &&
      accessTokenCache.expires_in * 1000 + accessTokenCache.create_time.getTime() <
        new Date().getTime(),
  )
  if (
    accessTokenCache?.user_id === Number(userId) &&
    accessTokenCache.expires_in * 1000 + accessTokenCache.create_time.getTime() >
      new Date().getTime()
  ) {
    return accessTokenCache
  }
  const token = await readAccessToken({ user_id: Number(userId) })

  // 判断过期
  if (token && token.expires_in * 1000 + token.create_time.getTime() < new Date().getTime()) {
    // refresh token using the safe refresh function
    console.log('start refreshing token...', token)
    try {
      accessTokenCache = await safeRefreshToken(token)
    } catch (e) {
      console.error('刷新 Token 失败，自动登出', e)
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
}
